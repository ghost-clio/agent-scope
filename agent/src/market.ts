/**
 * Market Data Provider
 * 
 * Fetches real-time token prices and market data from public APIs.
 * This is the DISCOVER phase of the agent loop.
 */

import { AgentLog } from './logger.js';

interface TokenData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}

export class MarketDataProvider {
  private logger: AgentLog;
  private cache: Map<string, { data: TokenData; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  constructor(logger: AgentLog) {
    this.logger = logger;
  }

  /**
   * Fetch market data for tracked tokens on Base.
   * Uses CoinGecko free API (no key needed).
   */
  async getMarketData(symbols: string[] = ['ETH', 'USDC', 'DAI']): Promise<TokenData[]> {
    const startTime = Date.now();

    // Map symbols to CoinGecko IDs
    const geckoIds: Record<string, string> = {
      ETH: 'ethereum',
      WETH: 'weth',
      USDC: 'usd-coin',
      DAI: 'dai',
      cbETH: 'coinbase-wrapped-staked-eth',
      WBTC: 'wrapped-bitcoin',
    };

    const ids = symbols.map(s => geckoIds[s]).filter(Boolean);
    if (ids.length === 0) {
      this.logger.logError('market-data', 'No valid token IDs to fetch');
      return [];
    }

    // Check cache first
    const now = Date.now();
    const cached = symbols.filter(s => {
      const entry = this.cache.get(s);
      return entry && (now - entry.timestamp) < this.CACHE_TTL_MS;
    });

    if (cached.length === symbols.length) {
      return cached.map(s => this.cache.get(s)!.data);
    }

    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error ${response.status}: ${await response.text()}`);
      }

      const coins = await response.json() as any[];

      const results: TokenData[] = coins.map(coin => {
        const symbol = Object.entries(geckoIds).find(([, id]) => id === coin.id)?.[0] || coin.symbol.toUpperCase();
        
        const data: TokenData = {
          symbol,
          name: coin.name,
          price: coin.current_price,
          priceChange24h: coin.price_change_percentage_24h || 0,
          volume24h: coin.total_volume || 0,
          marketCap: coin.market_cap || 0,
        };

        // Update cache
        this.cache.set(symbol, { data, timestamp: now });
        return data;
      });

      this.logger.logToolCall('market-data-fetch', {
        tokens: results.map(r => r.symbol),
        count: results.length,
        source: 'coingecko',
      }, Date.now() - startTime);

      return results;
    } catch (error: any) {
      this.logger.logToolCall('market-data-fetch', {
        error: error.message,
        tokens: symbols,
      }, Date.now() - startTime);

      // Return cached data if available (even if stale)
      return symbols
        .map(s => this.cache.get(s)?.data)
        .filter((d): d is TokenData => d !== undefined);
    }
  }
}
