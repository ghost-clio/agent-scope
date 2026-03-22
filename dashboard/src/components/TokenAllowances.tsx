import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, isAddress } from "viem";
import abi from "../abi.json";
import { MODULE_ADDRESS } from "../config";

const COMMON_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": { symbol: "USDC", decimals: 6 },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": { symbol: "USDT", decimals: 6 },
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": { symbol: "DAI", decimals: 18 },
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": { symbol: "WETH", decimals: 18 },
};

export function TokenAllowances() {
  const [agent, setAgent] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [dailyAmount, setDailyAmount] = useState("1000");
  const [decimals, setDecimals] = useState(18);
  const [expanded, setExpanded] = useState(true);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check existing allowance
  const { data: currentAllowance } = useReadContract({
    address: MODULE_ADDRESS,
    abi,
    functionName: "tokenAllowances",
    args: isAddress(agent) && isAddress(tokenAddress)
      ? [agent as `0x${string}`, tokenAddress as `0x${string}`]
      : undefined,
    query: { enabled: isAddress(agent) && isAddress(tokenAddress) },
  });

  const handleSetAllowance = () => {
    if (!isAddress(agent) || !isAddress(tokenAddress)) return;
    writeContract({
      address: MODULE_ADDRESS,
      abi,
      functionName: "setTokenAllowance",
      args: [
        agent as `0x${string}`,
        tokenAddress as `0x${string}`,
        parseUnits(dailyAmount, decimals),
      ],
    });
  };

  const handleTokenSelect = (addr: string) => {
    setTokenAddress(addr);
    if (COMMON_TOKENS[addr]) {
      setDecimals(COMMON_TOKENS[addr].decimals);
    }
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          Token Spending Limits
        </h2>
        <span style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
          {expanded ? "▾" : "▸"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: "1rem" }}>
          {/* Agent */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Agent Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          {/* Quick token select */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Token</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              {Object.entries(COMMON_TOKENS).map(([addr, { symbol }]) => (
                <button
                  key={addr}
                  onClick={() => handleTokenSelect(addr)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    border: tokenAddress === addr ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
                    background: tokenAddress === addr ? "rgba(59, 130, 246, 0.1)" : "var(--bg-primary)",
                    color: tokenAddress === addr ? "var(--accent-blue)" : "var(--text-secondary)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or paste any ERC20 address..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          {/* Amount + Decimals */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ flex: 3 }}>
              <label style={labelStyle}>Daily Limit (tokens)</label>
              <input
                type="number"
                value={dailyAmount}
                onChange={(e) => setDailyAmount(e.target.value)}
                className="font-mono"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Decimals</label>
              <input
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(parseInt(e.target.value))}
                className="font-mono"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Current allowance display */}
          {currentAllowance !== undefined && (
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.75rem",
                fontSize: "0.8rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Current daily allowance</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>
                {formatUnits(currentAllowance as bigint, decimals)} tokens
              </span>
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSetAllowance}
            disabled={!isAddress(agent) || !isAddress(tokenAddress) || isPending || isConfirming}
            style={{ width: "100%", padding: "0.75rem" }}
          >
            {isPending
              ? "Confirm in wallet..."
              : isConfirming
              ? "Confirming..."
              : "Set Token Allowance"}
          </button>

          {isSuccess && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.5rem",
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid var(--accent-green)",
                borderRadius: "6px",
                fontSize: "0.8rem",
                color: "var(--accent-green)",
              }}
            >
              ✓ Token allowance set!
              {hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  style={{ marginLeft: "0.5rem", color: "var(--accent-blue)" }}
                >
                  View tx →
                </a>
              )}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.5rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--accent-red)",
                borderRadius: "6px",
                fontSize: "0.8rem",
                color: "var(--accent-red)",
              }}
            >
              ✗ {(error as any).shortMessage || error.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  color: "var(--text-secondary)",
  marginBottom: "0.25rem",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box",
};
