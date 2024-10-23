// URL to fetch the latest Ethereum price in USDT from Binance API
export const BINANCE_ETH_PRICE_URL =
  'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT';

// Time-to-live for the Ethereum price cache in seconds
export const ETH_PRICE_CACHE_TTL = 1; // 1 second

// Cache key for storing the latest Ethereum price
export const LATEST_ETH_PRICE_CACHE_KEY = 'latestEthPrice';
