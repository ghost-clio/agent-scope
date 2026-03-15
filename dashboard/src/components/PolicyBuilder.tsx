import { useState, useCallback } from "react";

/* ═══════════════════════════════════════════════
   KNOWN CONTRACTS & FUNCTIONS (mirrors policy/compiler.ts)
   ═══════════════════════════════════════════════ */

const KNOWN_CONTRACTS: Record<string, { address: string; name: string }> = {
  uniswap: { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", name: "Uniswap V3 Router" },
  aave: { address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", name: "Aave V3 Pool" },
  "1inch": { address: "0x1111111254EEB25477B68fb85Ed929f73A960582", name: "1inch Router" },
  compound: { address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3", name: "Compound III" },
};

const KNOWN_FUNCTIONS: Record<string, { selector: string; name: string }> = {
  swap: { selector: "0x38ed1739", name: "swapExactTokensForTokens" },
  transfer: { selector: "0xa9059cbb", name: "transfer" },
  approve: { selector: "0x095ea7b3", name: "approve" },
  deposit: { selector: "0xd0e30db0", name: "deposit" },
  withdraw: { selector: "0x2e1a7d4d", name: "withdraw" },
  supply: { selector: "0x617ba037", name: "supply" },
  borrow: { selector: "0xa415bcad", name: "borrow" },
};

const KNOWN_TOKENS: Record<string, { address: string; decimals: number }> = {
  USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  DAI: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
};

/* ═══════════════════════════════════════════════
   NATURAL LANGUAGE PARSER (browser-compatible)
   ═══════════════════════════════════════════════ */

interface ParsedPolicy {
  spending: {
    native?: { dailyLimit: string; perTransaction?: string };
    tokens: Array<{ symbol: string; dailyLimit: string; address: string }>;
  };
  contracts: Array<{ name: string; address: string }>;
  functions: Array<{ name: string; selector: string }>;
  expiry?: string;
  warnings: string[];
}

function parseNL(input: string): ParsedPolicy {
  const lower = input.toLowerCase();
  const result: ParsedPolicy = {
    spending: { tokens: [] },
    contracts: [],
    functions: [],
    warnings: [],
  };

  // Native ETH limits
  const dailyMatch = lower.match(/([\d.]+)\s*eth\s*(?:per\s*day|\/day|daily)/);
  if (dailyMatch) {
    result.spending.native = { dailyLimit: `${dailyMatch[1]} ETH` };
    const perTxMatch = lower.match(/([\d.]+)\s*eth\s*(?:per\s*(?:tx|transaction)|\/tx|max\s*per)/);
    if (perTxMatch) {
      result.spending.native.perTransaction = `${perTxMatch[1]} ETH`;
    }
  }

  // Token limits
  const tokenMatches = lower.matchAll(/([\d,.]+)\s*(usdc|usdt|dai)\s*(?:per\s*day|\/day|daily)/gi);
  for (const match of tokenMatches) {
    const symbol = match[2].toUpperCase();
    const info = KNOWN_TOKENS[symbol];
    if (info) {
      result.spending.tokens.push({
        symbol,
        dailyLimit: match[1].replace(/,/g, ""),
        address: info.address,
      });
    }
  }

  // Contract restrictions
  const onlyMatch = lower.match(/(?:only|just|whitelist)\s+([\w\s,&]+?)(?:\.|,\s*(?:only|max|no|expires|[\d.])|$)/);
  if (onlyMatch) {
    const names = onlyMatch[1].split(/[,&]|\band\b/).map(n => n.trim().toLowerCase()).filter(Boolean);
    for (const name of names) {
      if (KNOWN_CONTRACTS[name]) {
        result.contracts.push({ name: KNOWN_CONTRACTS[name].name, address: KNOWN_CONTRACTS[name].address });
      }
      if (KNOWN_FUNCTIONS[name]) {
        result.functions.push({ name: KNOWN_FUNCTIONS[name].name, selector: KNOWN_FUNCTIONS[name].selector });
      }
    }
  }

  // Function-only match
  const fnMatch = lower.match(/only\s+(swap|transfer|approve|deposit|withdraw)(?:\(\))?/);
  if (fnMatch && KNOWN_FUNCTIONS[fnMatch[1]]) {
    const fn = KNOWN_FUNCTIONS[fnMatch[1]];
    if (!result.functions.find(f => f.selector === fn.selector)) {
      result.functions.push({ name: fn.name, selector: fn.selector });
    }
  }

  // Expiry
  const hoursMatch = lower.match(/expires?\s+(?:in\s+)?(\d+)\s*h/);
  if (hoursMatch) {
    const ms = parseInt(hoursMatch[1]) * 3600000;
    result.expiry = new Date(Date.now() + ms).toISOString();
  }
  const daysMatch = lower.match(/expires?\s+(?:in\s+)?(\d+)\s*d/);
  if (daysMatch) {
    const ms = parseInt(daysMatch[1]) * 86400000;
    result.expiry = new Date(Date.now() + ms).toISOString();
  }

  // Warnings
  if (!result.spending.native && result.spending.tokens.length === 0) {
    result.warnings.push("No spending limits detected");
  }
  if (result.contracts.length === 0) {
    result.warnings.push("No contract restrictions — agent can interact with any contract");
  }
  if (!result.expiry) {
    result.warnings.push("No expiry — permissions are permanent until revoked");
  }

  return result;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

const EXAMPLES = [
  "0.5 ETH per day, 0.1 ETH per tx, only Uniswap, only swap(), expires in 24h",
  "1000 USDC daily, only Aave, expires in 7d",
  "0.05 ETH per day, 0.001 ETH per tx, expires in 3d",
  "2 ETH per day, 0.5 ETH per tx, only Uniswap and Aave, expires in 30d",
];

export function PolicyBuilder() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedPolicy | null>(null);
  const [animating, setAnimating] = useState(false);

  const handleParse = useCallback(() => {
    if (!input.trim()) return;
    setAnimating(true);
    // Small delay for visual effect
    setTimeout(() => {
      setParsed(parseNL(input));
      setAnimating(false);
    }, 400);
  }, [input]);

  const handleExample = useCallback((text: string) => {
    setInput(text);
    setAnimating(true);
    setTimeout(() => {
      setParsed(parseNL(text));
      setAnimating(false);
    }, 400);
  }, []);

  return (
    <div>
      {/* Input */}
      <div style={{
        background: "rgba(16,16,24,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "1.5rem",
        marginBottom: "1rem",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "1rem",
        }}>
          <span style={{ fontSize: "1.2rem" }}>📝</span>
          <span style={{
            fontSize: "0.75rem", color: "#6b6b80",
            textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
          }}>
            Describe your agent's permissions in plain English
          </span>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
          placeholder='Try: "0.5 ETH per day, only Uniswap, only swap(), expires in 24h"'
          style={{
            width: "100%",
            minHeight: 80,
            background: "rgba(5,5,8,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "1rem",
            color: "#f0f0f5",
            fontSize: "0.95rem",
            fontFamily: "'JetBrains Mono', monospace",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
          }}
        />

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "0.75rem",
        }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExample(ex)}
                style={{
                  background: "rgba(68,136,255,0.06)",
                  border: "1px solid rgba(68,136,255,0.15)",
                  borderRadius: 8,
                  padding: "0.3rem 0.6rem",
                  color: "#4488ff",
                  fontSize: "0.65rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(68,136,255,0.12)";
                  e.currentTarget.style.borderColor = "rgba(68,136,255,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(68,136,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(68,136,255,0.15)";
                }}
              >
                Example {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleParse}
            disabled={!input.trim() || animating}
            style={{
              background: input.trim() ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${input.trim() ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 10,
              padding: "0.5rem 1.5rem",
              color: input.trim() ? "#00ff88" : "#6b6b80",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: input.trim() ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            {animating ? "Parsing..." : "Parse Policy →"}
          </button>
        </div>
      </div>

      {/* Output */}
      {parsed && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          animation: "fadeIn 0.5s ease",
        }}>
          {/* Left: Human-readable summary */}
          <div style={{
            background: "rgba(16,16,24,0.8)",
            border: "1px solid rgba(0,255,136,0.15)",
            borderRadius: 16,
            padding: "1.5rem",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "1rem",
            }}>
              <span style={{ fontSize: "1rem" }}>📋</span>
              <span style={{
                fontSize: "0.7rem", color: "#00ff88",
                textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
              }}>
                Human-Readable Policy
              </span>
            </div>

            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: 2 }}>
              {parsed.spending.native && (
                <div>
                  <span style={{ color: "#6b6b80" }}>Daily limit:</span>{" "}
                  <span style={{ color: "#00ff88", fontWeight: 600 }}>{parsed.spending.native.dailyLimit}</span>
                  {parsed.spending.native.perTransaction && (
                    <span style={{ color: "#6b6b80" }}> ({parsed.spending.native.perTransaction}/tx)</span>
                  )}
                </div>
              )}

              {parsed.spending.tokens.map((t) => (
                <div key={t.symbol}>
                  <span style={{ color: "#6b6b80" }}>Token limit:</span>{" "}
                  <span style={{ color: "#8844ff", fontWeight: 600 }}>{t.dailyLimit} {t.symbol}</span>
                  <span style={{ color: "#6b6b80" }}>/day</span>
                </div>
              ))}

              {parsed.contracts.length > 0 && (
                <div>
                  <span style={{ color: "#6b6b80" }}>Contracts:</span>{" "}
                  {parsed.contracts.map((c, i) => (
                    <span key={c.address}>
                      {i > 0 && ", "}
                      <span style={{ color: "#4488ff" }}>{c.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {parsed.functions.length > 0 && (
                <div>
                  <span style={{ color: "#6b6b80" }}>Functions:</span>{" "}
                  {parsed.functions.map((f, i) => (
                    <span key={f.selector}>
                      {i > 0 && ", "}
                      <span style={{ color: "#ffaa00" }}>{f.name}()</span>
                    </span>
                  ))}
                </div>
              )}

              {parsed.expiry && (
                <div>
                  <span style={{ color: "#6b6b80" }}>Expires:</span>{" "}
                  <span style={{ color: "#ff3366" }}>{new Date(parsed.expiry).toLocaleString()}</span>
                </div>
              )}

              {parsed.contracts.length === 0 && (
                <div style={{ color: "#ffaa00", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                  ⚠ No contract restrictions
                </div>
              )}
            </div>

            {/* Warnings */}
            {parsed.warnings.length > 0 && (
              <div style={{
                marginTop: "1rem", padding: "0.75rem",
                background: "rgba(255,170,0,0.05)",
                border: "1px solid rgba(255,170,0,0.15)",
                borderRadius: 8,
              }}>
                {parsed.warnings.map((w, i) => (
                  <div key={i} style={{
                    color: "#ffaa00", fontSize: "0.7rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: "0.15rem 0",
                  }}>
                    ⚠ {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: On-chain parameters */}
          <div style={{
            background: "rgba(16,16,24,0.8)",
            border: "1px solid rgba(68,136,255,0.15)",
            borderRadius: 16,
            padding: "1.5rem",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "1rem",
            }}>
              <span style={{ fontSize: "1rem" }}>🔗</span>
              <span style={{
                fontSize: "0.7rem", color: "#4488ff",
                textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
              }}>
                On-Chain Parameters
              </span>
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.75rem",
              lineHeight: 2,
            }}>
              <div>
                <span style={{ color: "#6b6b80" }}>dailyLimitWei: </span>
                <span style={{ color: "#f0f0f5" }}>
                  {parsed.spending.native
                    ? `${BigInt(Math.floor(parseFloat(parsed.spending.native.dailyLimit) * 1e18)).toString()}`
                    : "0"}
                </span>
              </div>
              <div>
                <span style={{ color: "#6b6b80" }}>maxPerTxWei: </span>
                <span style={{ color: "#f0f0f5" }}>
                  {parsed.spending.native?.perTransaction
                    ? `${BigInt(Math.floor(parseFloat(parsed.spending.native.perTransaction) * 1e18)).toString()}`
                    : "0"}
                </span>
              </div>
              <div>
                <span style={{ color: "#6b6b80" }}>sessionExpiry: </span>
                <span style={{ color: "#f0f0f5" }}>
                  {parsed.expiry ? Math.floor(new Date(parsed.expiry).getTime() / 1000) : "0 (never)"}
                </span>
              </div>
              <div>
                <span style={{ color: "#6b6b80" }}>allowedContracts: </span>
                <span style={{ color: "#4488ff" }}>
                  [{parsed.contracts.map(c => c.address.slice(0, 6) + "...").join(", ")}]
                </span>
              </div>
              <div>
                <span style={{ color: "#6b6b80" }}>allowedFunctions: </span>
                <span style={{ color: "#ffaa00" }}>
                  [{parsed.functions.map(f => f.selector).join(", ")}]
                </span>
              </div>
            </div>

            {/* Ready to deploy badge */}
            <div style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1rem",
              background: "rgba(0,255,136,0.05)",
              border: "1px solid rgba(0,255,136,0.15)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <span style={{ color: "#00ff88", fontSize: "1rem" }}>✅</span>
              <div>
                <div style={{ color: "#00ff88", fontSize: "0.75rem", fontWeight: 600 }}>
                  Ready to deploy
                </div>
                <div style={{ color: "#6b6b80", fontSize: "0.65rem" }}>
                  Connect wallet → call setAgentPolicy() with these params
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
