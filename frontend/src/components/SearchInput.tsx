import React, { useState } from "react";
import { useSearchTransactionByHashQuery } from "../core/queries/search-transaction-by-hash";

/**
 * SearchInput component allows users to search for a transaction by its hash.
 * It maintains the search query state and triggers a search when the form is submitted.
 *
 * @component
 * @example
 * return (
 *   <SearchInput />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 */
const SearchInput: React.FC = (): JSX.Element => {
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  const { data: searchResult = null, isFetching } =
    useSearchTransactionByHashQuery({
      variables: {
        hash: searchQuery ?? "",
      },
      enabled: searchQuery !== undefined,
    });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Trim the query
    const currentQuery = query?.trim();

    // If the query is empty, do nothing
    if (currentQuery?.length === 0) return;

    setSearchQuery(currentQuery);
  };

  return (
    <div className="flex flex-col justify-center items-center h-full mt-4 w-full flex-1 px-4">
      <form onSubmit={handleSearch} className="flex items-center gap-4 w-1/3">
        <input
          required
          type="text"
          placeholder="Search by transaction hash"
          onChange={handleInputChange}
          className="flex-grow p-2 border border-gray-300 rounded"
        />
      </form>

      {/* Display the search result if a query has been made */}
      {searchQuery !== undefined && (
        <div className="mb-4 flex w-full flex-col justify-between bg-gray-100 p-4 rounded-lg shadow-md mt-2 overflow-hidden">
          <h2 className="text-lg font-semibold mb-2 truncate">
            Search Result:
          </h2>

          <div className="flex-wrap break-words">
            Hash: <span className="text-sm">{searchQuery}</span>
          </div>

          {isFetching ? (
            <div>Loading...</div>
          ) : searchResult === null ? (
            <div>The transaction with the given hash was not found</div>
          ) : (
            <div className="text-md">
              <p className="mb-1 truncate">
                Fee in ETH:{" "}
                <span className="font-medium">{searchResult.feeInEth}</span>
              </p>
              <p className="mb-1 truncate">
                Fee in USDT:{" "}
                <span className="font-medium">{searchResult.feeInUsdt}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
