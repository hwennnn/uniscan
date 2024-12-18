export const USDC_ETH_POOL_ADDRESS =
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';

// ABI for the Uniswap V3 Pool contract
export const UNISWAP_V3_POOL_ABI = [
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
];

export const INFURA_WEB_SOCKET_URL = (apiKey: string) =>
  `wss://mainnet.infura.io/ws/v3/${apiKey}`;

export const INFURA_API_URL = (apiKey: string) =>
  `https://mainnet.infura.io/v3/${apiKey}`;

const ETHERSCAN_API_BASE_URL = 'https://api.etherscan.io/api';

export const ETHERSCAN_API_BLOCK_NUMBER_URL = (
  timestamp: string,
  closest: 'before' | 'after',
  apiKey: string,
) =>
  `${ETHERSCAN_API_BASE_URL}?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=${closest}&apikey=${apiKey}`;

/**
 * Constructs the URL for fetching token transactions from Etherscan API.
 *
 * @param page - The page number of the results to fetch.
 * @param offset - The number of results to return per page.
 * @param startBlock - The starting block number to fetch transactions from.
 * @param endBlock - The ending block number to fetch transactions up to.
 * @param apiKey - The API key for authenticating with the Etherscan API.
 * @returns The constructed URL for the Etherscan API request.
 */
export const ETHERSCAN_API_TOKEN_TRANSACTIONS_URL = (
  page: number,
  offset: number,
  startBlock: number,
  endBlock: number,
  apiKey: string,
) =>
  `${ETHERSCAN_API_BASE_URL}?module=account&action=tokentx&address=${USDC_ETH_POOL_ADDRESS}&page=${page}&offset=${offset}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${apiKey}`;

export const DEFAULT_HISTORICAL_TRANSACTIONS_PAGE_SIZE = 100;

export enum TransactionJob {
  ProcessHistoricalTransactions = 'process-historical-transactions',
}
