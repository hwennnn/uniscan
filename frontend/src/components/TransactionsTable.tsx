import { keepPreviousData } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Transaction } from "../core/models/transaction";
import { useTransactionsQuery } from "../core/queries/get-transactions";
import { useTransactionsSummaryQuery } from "../core/queries/get-transactions-summary";

const DEFAULT_TRANSACTIONS_PER_PAGE = 10; // Set to 10 to show a maximum of 10 transactions per page

// Define columns for the table
const columns: ColumnDef<Transaction>[] = [
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

const TransactionsTable = () => {
  const [cursor, setCursor] = useState<undefined | string>(undefined);

  // Define pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_TRANSACTIONS_PER_PAGE, // Set initial page size to 10
  });

  const {
    data: transactionsPage = null,
    isFetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery({
    variables: {
      take: pagination.pageSize,
      cursor,
      offset: pagination.pageIndex * pagination.pageSize,
    },
    placeholderData: keepPreviousData,
  });

  const { data: summary = null, refetch: refetchSummary } =
    useTransactionsSummaryQuery({
      staleTime: Infinity,
    });

  const transactions = useMemo(() => {
    if (!transactionsPage) {
      return [];
    }

    return transactionsPage.transactions;
  }, [transactionsPage]);

  useEffect(() => {
    if (!cursor && transactions.length > 0) {
      setCursor(transactions[0].id.toString());
    }
  }, [cursor, transactions]);

  // Initialize table instance
  const table = useReactTable({
    data: transactions,
    pageCount: transactionsPage?.totalPages || 0,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    debugTable: true,
  });

  const handleRefresh = () => {
    setPagination({ pageIndex: 0, pageSize: DEFAULT_TRANSACTIONS_PER_PAGE });
    setCursor(undefined);
    refetchSummary();
    refetchTransactions();
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <div className="mb-4 flex flex-row items-end justify-between bg-gray-100 p-4 rounded-lg shadow-md">
        {summary !== null && (
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
        )}

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
