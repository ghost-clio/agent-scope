/**
 * Uniswap Swap Executor
 * 
 * Executes real token swaps on Base via the Uniswap Developer Platform API.
 * Every swap produces a real TxID verifiable on BaseScan.
 */

import { ethers } from 'ethers';
import { AgentLog } from './logger.js';

interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  route: string[];
  gasEstimate: string;
}

interface SwapResult {
  success: boolean;
  txHash?: string;
  amountIn?: string;
  amountOut?: string;
  gasUsed?: string;
  error?: string;
}

// Base chain token addresses
const BASE_TOKENS: Record<string, string> = {
  ETH: '0x0000000000000000000000000000000000000000',
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
};

// Uniswap Universal Router on Base
const UNIVERSAL_ROUTER = '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC';

export class UniswapExecutor {
  private logger: AgentLog;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private apiKey: string;
  private dailySwapCount: number = 0;
  // Strategy-level limits (slippage, price impact) — NOT spending limits.
  // Spending limits are enforced by AgentScope on-chain. See SAFETY.md.
  private readonly MAX_SLIPPAGE_BPS = 100; // 1% — contract can't check this (needs quote data)

  constructor(logger: AgentLog) {
    this.logger = logger;
    this.apiKey = process.env.UNISWAP_API_KEY || '';
    
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.AGENT_WALLET_KEY;
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
  }

  /**
   * Get a swap quote from Uniswap API
   */
  async getQuote(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountInUsd: number
  ): Promise<SwapQuote | null> {
    const tokenIn = BASE_TOKENS[tokenInSymbol];
    const tokenOut = BASE_TOKENS[tokenOutSymbol];

    if (!tokenIn || !tokenOut) {
      this.logger.logError('uniswap-quote', `Unknown token: ${tokenInSymbol} or ${tokenOutSymbol}`);
      return null;
    }

    const startTime = Date.now();

    try {
      // Use Uniswap's API for quoting
      const response = await fetch('https://api.uniswap.org/v2/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          tokenInChainId: 8453, // Base
          tokenOutChainId: 8453,
          tokenIn,
          tokenOut,
          amount: ethers.parseUnits(amountInUsd.toString(), tokenInSymbol === 'USDC' ? 6 : 18).toString(),
          type: 'EXACT_INPUT',
          configs: [{
            routingType: 'CLASSIC',
            protocols: ['V3', 'V2'],
          }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Uniswap API error ${response.status}: ${errText}`);
      }

      const data = await response.json() as any;
      const quote = data.quote;

      const result: SwapQuote = {
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountIn: quote?.amountIn || '0',
        amountOut: quote?.amountOut || '0',
        priceImpact: parseFloat(quote?.priceImpact || '0'),
        route: quote?.route?.map((r: any) => r.address) || [],
        gasEstimate: quote?.gasEstimate || '0',
      };

      this.logger.logToolCall('uniswap-quote', {
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountInUsd,
        quote: {
          amountOut: result.amountOut,
          priceImpact: result.priceImpact,
          gasEstimate: result.gasEstimate,
        },
      }, Date.now() - startTime);

      return result;
    } catch (error: any) {
      this.logger.logToolCall('uniswap-quote', {
        error: error.message,
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
      }, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Build swap calldata without sending.
   * Returns the raw transaction data that can be routed through AgentScope/Safe.
   * 
   * Strategy-level checks (slippage) happen here.
   * Spending limits are NOT checked here — that's AgentScope's job (on-chain).
   */
  async buildSwapCalldata(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountInUsd: number
  ): Promise<{ 
    success: boolean;
    to?: string;
    value?: string;
    data?: string;
    quote?: SwapQuote;
    error?: string;
  }> {
    // Get quote first
    const quote = await this.getQuote(tokenInSymbol, tokenOutSymbol, amountInUsd);
    if (!quote) {
      return { success: false, error: 'Failed to get quote' };
    }

    // Strategy check: slippage / price impact
    // This CANNOT be enforced on-chain (needs off-chain quote data).
    // AgentScope enforces spending limits. This enforces execution quality.
    if (Math.abs(quote.priceImpact) > this.MAX_SLIPPAGE_BPS / 100) {
      const msg = `Price impact ${quote.priceImpact}% exceeds ${this.MAX_SLIPPAGE_BPS / 100}% limit`;
      this.logger.logSafetyCheck('swap-slippage', {
        priceImpact: quote.priceImpact,
        limit: this.MAX_SLIPPAGE_BPS / 100,
        blocked: true,
        note: 'Strategy-level check (slippage). Spending limits enforced by AgentScope.',
      });
      return { success: false, error: msg };
    }

    try {
      const swapResponse = await fetch('https://api.uniswap.org/v2/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          quote: quote,
          tokenInChainId: 8453,
          tokenOutChainId: 8453,
          slippageTolerance: this.MAX_SLIPPAGE_BPS / 10000,
          deadline: Math.floor(Date.now() / 1000) + 300,
        }),
      });

      if (!swapResponse.ok) {
        throw new Error(`Swap API error: ${await swapResponse.text()}`);
      }

      const swapData = await swapResponse.json() as any;

      return {
        success: true,
        to: swapData.to || UNIVERSAL_ROUTER,
        value: swapData.value || '0',
        data: swapData.calldata,
        quote,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a swap directly (local/demo mode — no Safe).
   * 
   * In production with AgentScope on-chain, DON'T call this.
   * Instead, use buildSwapCalldata() + scope.execute() to route through the Safe.
   * This ensures the on-chain policy is actually enforced, not just checked.
   * 
   * See SAFETY.md for the full enforcement model.
   */
  async executeSwapDirect(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountInUsd: number
  ): Promise<SwapResult> {
    if (!this.wallet) {
      return { success: false, error: 'No wallet configured (AGENT_WALLET_KEY not set)' };
    }

    const calldata = await this.buildSwapCalldata(tokenInSymbol, tokenOutSymbol, amountInUsd);
    if (!calldata.success || !calldata.to || !calldata.data) {
      return { success: false, error: calldata.error || 'Failed to build calldata' };
    }

    const startTime = Date.now();
    try {
      const tx = await this.wallet.sendTransaction({
        to: calldata.to,
        data: calldata.data,
        value: calldata.value || '0',
      });

      const receipt = await tx.wait();
      const elapsed = Date.now() - startTime;
      this.dailySwapCount++;

      const result: SwapResult = {
        success: true,
        txHash: receipt?.hash,
        amountIn: calldata.quote?.amountIn,
        amountOut: calldata.quote?.amountOut,
        gasUsed: receipt?.gasUsed?.toString(),
      };

      this.logger.logExecution('swap-executed', {
        success: true,
        txHash: result.txHash,
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountInUsd,
        route: 'direct (no Safe)',
        latencyMs: elapsed,
        explorerUrl: `https://basescan.org/tx/${result.txHash}`,
        valueUsd: amountInUsd,
      });

      return result;
    } catch (error: any) {
      this.logger.logExecution('swap-failed', {
        success: false,
        error: error.message,
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountInUsd,
        latencyMs: Date.now() - startTime,
        valueUsd: 0,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wallet balance on Base
   */
  async getBalance(): Promise<{ eth: string; usdcBalance?: string }> {
    if (!this.wallet) {
      return { eth: '0' };
    }

    try {
      const ethBalance = await this.provider.getBalance(this.wallet.address);
      
      // Check USDC balance
      const usdcContract = new ethers.Contract(
        BASE_TOKENS.USDC,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const usdcBalance = await usdcContract.balanceOf(this.wallet.address);

      return {
        eth: ethers.formatEther(ethBalance),
        usdcBalance: ethers.formatUnits(usdcBalance, 6),
      };
    } catch (error: any) {
      this.logger.logError('balance-check', error);
      return { eth: '0' };
    }
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  getDailySwapCount(): number {
    return this.dailySwapCount;
  }
}
