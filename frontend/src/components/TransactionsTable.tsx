import { keepPreviousData } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { BatchStatus, HistoricalTransaction } from "../core/models/transaction";
import { useHistoricalTransactions } from "../core/queries/get-historical-transactions";
import { useHistoricalTransactionsBatchInfo } from "../core/queries/get-historical-transactions-batch-info";
import { useTransactionsQuery } from "../core/queries/get-transactions";
import { useTransactionsSummaryQuery } from "../core/queries/get-transactions-summary";
import { useSearchHistorialTransactions } from "../core/queries/search-historical-transactions";
import DateRangePicker from "./DateRangePicker";

const DEFAULT_TRANSACTIONS_PER_PAGE = 10; // Set to 10 to show a maximum of 10 transactions per page

// Define columns for the table
const columns: ColumnDef<HistoricalTransaction>[] = [
  {
    accessorKey: "transactionHash",
    header: "Transaction Hash",
  },
  {
    accessorKey: "feeInEth",
    header: "Fee in ETH",
  },
  {
    accessorKey: "feeInUsdt",
    header: "Fee in USDT",
  },
];

type TablePaginationState = PaginationState & {
  cursor: string | undefined | null;
};

const TransactionsTable = () => {
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);

  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);

  const showHistoricalData = dateRange !== null;

  // Define pagination state
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_TRANSACTIONS_PER_PAGE, // Set initial page size to 10,
    cursor: undefined,
  });

  const {
    data: transactionsPage = null,
    isFetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery({
    variables: {
      take: pagination.pageSize,
      cursor: pagination.cursor ?? undefined,
      offset: pagination.pageIndex * pagination.pageSize,
    },
    enabled: !showHistoricalData,
    placeholderData: keepPreviousData,
  });

  const { data: summary = null, refetch: refetchSummary } =
    useTransactionsSummaryQuery({
      staleTime: Infinity,
      enabled: !showHistoricalData,
    });

  const { data: initialBatchInfo } = useSearchHistorialTransactions({
    variables: {
      dateFrom: dateRange?.[0] ?? 0,
      dateTo: dateRange?.[1] ?? 0,
    },
    enabled: showHistoricalData,
  });

  const { data: batchInfo } = useHistoricalTransactionsBatchInfo({
    variables: {
      batchId: initialBatchInfo?.id.toString() ?? "",
    },
    enabled:
      showHistoricalData &&
      (initialBatchInfo?.id !== undefined ||
        batchStatus === BatchStatus.IN_PROGRESS ||
        batchStatus === BatchStatus.PENDING),
    refetchInterval: 1000, // poll the batchStatus every second
  });

  const { data: historicalTransactions } = useHistoricalTransactions({
    variables: {
      batchId: initialBatchInfo?.id ?? 0,
      offset: pagination.pageIndex * pagination.pageSize,
      take: pagination.pageSize,
    },
    enabled:
      showHistoricalData &&
      batchInfo !== null &&
      batchInfo?.status === BatchStatus.COMPLETED,
  });

  const transactions = useMemo(() => {
    if (!showHistoricalData) {
      return transactionsPage ? transactionsPage.transactions : [];
    } else {
      return historicalTransactions ? historicalTransactions.transactions : [];
    }
  }, [historicalTransactions, showHistoricalData, transactionsPage]);

  const handleUpdateCursor = (cursor: string | undefined) => {
    setPagination((prev) => ({
      ...prev,
      cursor,
    }));
  };

  const handleUpdatePagination: React.Dispatch<
    React.SetStateAction<PaginationState>
  > = (state) => {
    setPagination((prev) => ({
      ...prev,
      ...state,
    }));
  };

  useEffect(() => {
    if (batchInfo !== undefined) {
      setBatchStatus(batchInfo?.status);
    }
  }, [batchInfo]);

  useEffect(() => {
    if (pagination.cursor === undefined && transactions.length > 0) {
      handleUpdateCursor(transactions[0].id.toString());
    }
  }, [pagination.cursor, transactions]);

  const totalPages = useMemo(() => {
    if (showHistoricalData) {
      return historicalTransactions?.totalPages || 0;
    }

    return transactionsPage?.totalPages || 0;
  }, [
    historicalTransactions?.totalPages,
    showHistoricalData,
    transactionsPage?.totalPages,
  ]);

  // Initialize table instance
  const table = useReactTable({
    data: transactions,
    pageCount: totalPages,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: handleUpdatePagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    debugTable: true,
  });

  const handleRefresh = () => {
    setPagination({
      pageIndex: 0,
      pageSize: DEFAULT_TRANSACTIONS_PER_PAGE,
      cursor: null,
    });
    refetchSummary();
    refetchTransactions();
  };

  const handleDateRangeChange = (range: [number, number] | null) => {
    setDateRange(range);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg py-2">
      <DateRangePicker onDateRangeChange={handleDateRangeChange} />

      {!showHistoricalData && summary !== null && (
        <div className="my-4 flex flex-row items-end justify-between bg-gray-100 p-4 rounded-lg shadow-md">
          <div className="flex-1 ">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <div className="text-md">
              <p className="mb-1">
                Total Transactions:{" "}
                <span className="font-medium">{summary.totalTxns}</span>
              </p>
              <p className="mb-1">
                Total Fees in ETH:{" "}
                <span className="font-medium">{summary.totalFeeETH}</span>
              </p>
              <p className="mb-1">
                Total Fees in USDT:{" "}
                <span className="font-medium">{summary.totalFeeUSDT}</span>
              </p>
            </div>
          </div>

          <div className="flex items-end">
            <button
              className="border rounded p-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
              onClick={handleRefresh}
              title="This will reset the pagination and refresh the summary data."
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {showHistoricalData && (
        <div className="my-4 flex flex-col items-center bg-gray-100 p-4 rounded-lg shadow-md">
          <p className="text-md mb-2">
            Searching historical transactions from
            <span className="ml-1 font-medium">
              {new Date(dateRange[0]).toDateString()}
            </span>{" "}
            to
            <span className="ml-1 font-medium">
              {new Date(dateRange[1]).toDateString()}
            </span>
          </p>

          {batchInfo !== undefined && (
            <div className="text-md">
              <p className="mb-1">
                Batch Status:{" "}
                <span
                  className={`font-medium ${
                    batchStatus === BatchStatus.IN_PROGRESS
                      ? "text-yellow-500"
                      : batchStatus === BatchStatus.PENDING
                      ? "text-orange-500"
                      : batchStatus === BatchStatus.COMPLETED
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {batchStatus === BatchStatus.IN_PROGRESS
                    ? "In Progress"
                    : batchStatus === BatchStatus.PENDING
                    ? "Pending"
                    : batchStatus === BatchStatus.COMPLETED
                    ? "Completed"
                    : "Unknown"}
                </span>
              </p>
              <p className="mb-1">
                Total Transactions:{" "}
                <span className="font-medium">{batchInfo?.totalTxns}</span>
              </p>
              <p className="mb-1">
                Total Fees in ETH:{" "}
                <span className="font-medium">{batchInfo.totalFeeInEth}</span>
              </p>
              <p className="mb-1">
                Total Fees in USDT:{" "}
                <span className="font-medium">{batchInfo.totalFeeInUsdt}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-2"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-2"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <div className="flex items-center gap-1">
            {Array.from(
              {
                length: Math.min(table.getPageCount(), 10),
              },
              (_, index) => {
                const pageIndex = table.getState().pagination.pageIndex;
                const startPage = Math.max(
                  0,
                  Math.min(pageIndex - 5, table.getPageCount() - 10)
                );
                const pageNumber = startPage + index;
                return (
                  <button
                    key={pageNumber}
                    className={`border rounded p-2 ${
                      pageIndex === pageNumber ? "bg-blue-500 text-white" : ""
                    }`}
                    onClick={() => table.setPageIndex(pageNumber)}
                  >
                    {pageNumber + 1}
                  </button>
                );
              }
            )}
          </div>
          <button
            className="border rounded p-2"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-2"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
        </div>

        <div className="flex flex-col space-y-2 items-center">
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </strong>
          </span>

          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border p-2 rounded"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
          {isFetching ? "Loading..." : null}
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
