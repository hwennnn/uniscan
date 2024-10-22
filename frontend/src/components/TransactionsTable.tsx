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

  const { data: transactionsPage = null, isFetching } = useTransactionsQuery({
    variables: {
      take: pagination.pageSize,
      cursor,
      offset: pagination.pageIndex * pagination.pageSize,
    },
    placeholderData: keepPreviousData,
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

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
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
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </button>
        </div>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount().toLocaleString()}
          </strong>
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`border rounded p-1 ${
                table.getState().pagination.pageIndex === index
                  ? "bg-blue-500 text-white"
                  : ""
              }`}
              onClick={() => table.setPageIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="border p-1 rounded"
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
  );
};

export default TransactionsTable;
