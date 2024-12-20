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
const TABLE_COLUMNS: ColumnDef<HistoricalTransaction>[] = [
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
  // The cursor is used to fetch the next page of data
  // There are three possible values: undefined, null, or a string
  // - string: This cursor will be used a frozen pagination cursor, and the next page will be fetched based on this cursor
  // - undefined: Fetch the first page of data (During initial load)
  // - null: Means the refresh button was clicked, and the pagination should be reset
  cursor: string | undefined | null;
};

/**
 * TransactionsTable component displays a table of transactions with pagination and filtering options.
 * It supports both real-time and historical data fetching based on the selected date range.
 *
 * @component
 * @example
 * // Usage example:
 * <TransactionsTable />
 *
 * @returns {JSX.Element} The rendered TransactionsTable component.
 *
 * @remarks
 * - The component uses various hooks to manage state and data fetching.
 * - It supports pagination with manual control over page index and page size.
 * - The table can display either real-time transactions or historical transactions based on the selected date range.
 * - The component includes a summary section for real-time data and a status section for historical data.
 *
 * @hook
 * - `useState` to manage component state.
 * - `useEffect` to handle side effects.
 * - `useMemo` to optimize performance by memoizing computed values.
 * - `useTransactionsQuery`, `useTransactionsSummaryQuery`, `useSearchHistorialTransactions`, `useHistoricalTransactionsBatchInfo`, `useHistoricalTransactions` for data fetching.
 *
 */
const TransactionsTable = (): JSX.Element => {
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);

  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);

  const showHistoricalData = dateRange !== null;

  // Define pagination state
  // It keep tracks of the current page index, tpage size, and cursor for fetching data
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_TRANSACTIONS_PER_PAGE, // Set initial page size to 10,
    cursor: undefined, // If there is no cursor, fetch the first page
  });

  /**
   * Fetches transaction data using the `useTransactionsQuery` hook.
   * It's only enabled when `showHistoricalData` is false.
   */
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
    placeholderData: keepPreviousData, // Keep the previous data while fetching new data,
  });

  /**
   * Fetches transaction summary data using the `useTransactionsSummaryQuery` hook.
   * The stale time is set to `Infinity` to prevent refetching the data.
   * Unless it's triggered manually by the user to refresh the summary.
   * It's only enabled when `showHistoricalData` is false.
   */
  const { data: summary = null, refetch: refetchSummary } =
    useTransactionsSummaryQuery({
      staleTime: Infinity,
      enabled: !showHistoricalData,
    });

  // There are three steps to fetch historical transactions:
  // Step 1: Fetch the initial batch info
  // After the date range is selected, the component fetches the initial batch info which contains the batch ID.
  const { data: initialBatchInfo } = useSearchHistorialTransactions({
    variables: {
      dateFrom: dateRange?.[0] ?? 0,
      dateTo: dateRange?.[1] ?? 0,
    },
    enabled: showHistoricalData,
    refetchOnWindowFocus: false,
  });

  // Step 2: Fetch the batch info
  // After the initial batch info is fetched, the component fetches the batch info using the batch ID.
  // It polls the batch status every second to get the latest status.
  // The batch status is used to determine if the batch is in progress, pending, or completed.
  const { data: batchInfo } = useHistoricalTransactionsBatchInfo({
    variables: {
      batchId: initialBatchInfo?.id.toString() ?? "",
    },
    enabled:
      showHistoricalData &&
      batchStatus !== BatchStatus.COMPLETED && // stop fetching if the batch is completed
      (initialBatchInfo?.id !== undefined ||
        batchStatus === BatchStatus.IN_PROGRESS ||
        batchStatus === BatchStatus.PENDING),
    refetchInterval: 1000, // poll the batchStatus every second
    refetchOnWindowFocus: false,
  });

  // Step 3: Fetch historical transactions
  // After the batch info is fetched, the component fetches the historical transactions using the batch ID.
  // It fetches the transactions based on the pagination state.
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
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Memoize the transactions based on the current state (real-time or historical)
  const transactions = useMemo(() => {
    if (!showHistoricalData) {
      return transactionsPage ? transactionsPage.transactions : [];
    } else {
      return historicalTransactions ? historicalTransactions.transactions : [];
    }
  }, [historicalTransactions, showHistoricalData, transactionsPage]);

  // Update the cursor state
  const handleUpdateCursor = (cursor: string | undefined) => {
    setPagination((prev) => ({
      ...prev,
      cursor,
    }));
  };

  // Update the pagination state
  const handleUpdatePagination: React.Dispatch<
    React.SetStateAction<PaginationState>
  > = (state) => {
    setPagination((prev) => ({
      ...prev,
      ...(typeof state === "function" ? state(prev) : state), // Handle function or object-based updates
    }));
  };

  // Update the batch status when the batch info changes
  useEffect(() => {
    if (batchInfo !== undefined) {
      setBatchStatus(batchInfo?.status);
    }
  }, [batchInfo]);

  // This is only triggered during the initial load (when the cursor is undefined)
  // It sets the cursor to the first transaction ID so the cursor will be 'frozen' for pagination
  useEffect(() => {
    if (pagination.cursor === undefined && transactions.length > 0) {
      handleUpdateCursor(transactions[0].id.toString());
    }
  }, [pagination.cursor, transactions]);

  // Calculate the total number of pages based on the data
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
    columns: TABLE_COLUMNS,
    state: {
      pagination,
    },
    onPaginationChange: handleUpdatePagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    debugTable: true,
  });

  // Handle the refresh button click (real-time data only)
  const handleRefresh = () => {
    setPagination({
      pageIndex: 0,
      pageSize: DEFAULT_TRANSACTIONS_PER_PAGE,
      cursor: null,
    });
    refetchSummary();
    refetchTransactions();
  };

  // Callback to handle date range change
  const handleDateRangeChange = (range: [number, number] | null) => {
    setDateRange(range);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg py-2">
      {/* Date Range Picker */}
      <DateRangePicker onDateRangeChange={handleDateRangeChange} />

      {/* Display summary of real-time data */}
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

      {/* Display batch info for historical data */}
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

      {/* Display the transactions table */}
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
          {table.getPageCount() !== 0 && (
            <span className="flex items-center gap-1">
              <div>Page</div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount().toLocaleString()}
              </strong>
            </span>
          )}

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
