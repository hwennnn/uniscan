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

export const ETHERSCAN_API_BASE_URL = 'https://api.etherscan.io/api';
