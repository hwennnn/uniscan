export const USDC_ETH_POOL_ADDRESS =
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';

// ABI for the Uniswap V3 Pool contract
export const UNISWAP_V3_POOL_ABI = [
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
];
