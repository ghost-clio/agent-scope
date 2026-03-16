import { useState } from "react";

type Chain = "ethereum" | "solana";

interface ChainConfig {
  name: string;
  icon: string;
  color: string;
  terminology: {
    contract: string;
    function: string;
    token: string;
    wallet: string;
    explorer: string;
    gasUnit: string;
  };
  examples: {
    dailyLimit: string;
    perTx: string;
    target: string;
    targetAddress: string;
    action: string;
    actionId: string;
    tokenLimit: string;
    tokenName: string;
  };
  status: "live";
  deployCount?: number;
}

const chains: Record<Chain, ChainConfig> = {
  ethereum: {
    name: "Ethereum / EVM",
    icon: "⟠",
    color: "#627EEA",
    terminology: {
      contract: "Contract",
      function: "Function Selector",
      token: "ERC20",
      wallet: "Safe",
      explorer: "Etherscan",
      gasUnit: "ETH",
    },
    examples: {
      dailyLimit: "0.5 ETH",
      perTx: "0.1 ETH",
      target: "Uniswap V3 Router",
      targetAddress: "0x68b3...Fc45",
      action: "swap()",
      actionId: "0x38ed1739",
      tokenLimit: "1000 USDC",
      tokenName: "USDC",
    },
    status: "live",
    deployCount: 10,
  },
  solana: {
    name: "Solana / SVM",
    icon: "◎",
    color: "#9945FF",
    terminology: {
      contract: "Program",
      function: "Instruction",
      token: "SPL Token",
      wallet: "Multisig (Squads)",
      explorer: "Solscan",
      gasUnit: "SOL",
    },
    examples: {
      dailyLimit: "2 SOL",
      perTx: "0.5 SOL",
      target: "Jupiter Aggregator",
      targetAddress: "JUP6L...vnPH",
      action: "route()",
      actionId: "0xe517cb97 (discriminator)",
      tokenLimit: "500 USDC",
      tokenName: "USDC",
    },
    status: "live",
  },
};

export function ChainToggle() {
  const [active, setActive] = useState<Chain>("ethereum");
  const config = chains[active];
  const other = active === "ethereum" ? "solana" : "ethereum";

  return (
    <div>
      {/* Toggle */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "0.5rem",
        marginBottom: "2rem",
      }}>
        {(Object.keys(chains) as Chain[]).map(chain => {
          const c = chains[chain];
          const isActive = chain === active;
          return (
            <button
              key={chain}
              onClick={() => setActive(chain)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.6rem 1.5rem", borderRadius: 12,
                background: isActive ? `${c.color}15` : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? `${c.color}40` : "rgba(255,255,255,0.06)"}`,
                color: isActive ? "#f0f0f5" : "#6b6b80",
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{c.icon}</span>
              {c.name}

            </button>
          );
        })}
      </div>

      {/* Concept mapping */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        gap: "0rem", alignItems: "start",
      }}>
        {/* Left: Abstract concept */}
        <div style={{
          background: "rgba(16,16,24,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px 0 0 16px",
          padding: "1.5rem",
        }}>
          <div style={{
            fontSize: "0.65rem", color: "#6b6b80", textTransform: "uppercase",
            letterSpacing: "0.1em", fontWeight: 600, marginBottom: "1rem",
          }}>
            ASP-1 Concept
          </div>
          {[
            { concept: "Daily Spend Limit", icon: "💰" },
            { concept: "Per-TX Maximum", icon: "📊" },
            { concept: "Allowed Target", icon: "📋" },
            { concept: "Allowed Action", icon: "⚡" },
            { concept: "Token Limit", icon: "🪙" },
            { concept: "Wallet Type", icon: "🔐" },
          ].map(row => (
            <div key={row.concept} style={{
              padding: "0.6rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              display: "flex", alignItems: "center", gap: "0.5rem",
              fontSize: "0.8rem", color: "#f0f0f5",
            }}>
              <span>{row.icon}</span> {row.concept}
            </div>
          ))}
        </div>

        {/* Center: Arrow */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "0 0.5rem",
          minHeight: "100%", gap: "2.15rem", paddingTop: "3rem",
        }}>
          {Array(6).fill(null).map((_, i) => (
            <span key={i} style={{ color: config.color, fontSize: "0.8rem", opacity: 0.6 }}>→</span>
          ))}
        </div>

        {/* Right: Chain-specific */}
        <div style={{
          background: `${config.color}08`,
          border: `1px solid ${config.color}20`,
          borderRadius: "0 16px 16px 0",
          padding: "1.5rem",
          transition: "all 0.3s ease",
        }}>
          <div style={{
            fontSize: "0.65rem", color: config.color, textTransform: "uppercase",
            letterSpacing: "0.1em", fontWeight: 600, marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span>{config.icon}</span> {config.name}
            {config.status === "live" && config.deployCount && (
              <span style={{
                fontSize: "0.55rem", padding: "0.1rem 0.4rem",
                borderRadius: 6, background: "rgba(0,255,136,0.1)",
                border: "1px solid rgba(0,255,136,0.2)",
                color: "#00ff88",
              }}>{config.deployCount} chains live</span>
            )}
          </div>
          {[
            { value: config.examples.dailyLimit, label: config.terminology.gasUnit },
            { value: config.examples.perTx, label: `per tx` },
            { value: config.examples.target, sub: config.examples.targetAddress },
            { value: config.examples.action, sub: config.examples.actionId },
            { value: config.examples.tokenLimit, label: config.terminology.token },
            { value: config.terminology.wallet, label: config.terminology.explorer },
          ].map((row, i) => (
            <div key={i} style={{
              padding: "0.6rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              fontSize: "0.8rem",
            }}>
              <span style={{ color: "#f0f0f5", fontWeight: 500 }}>{row.value}</span>
              {row.sub && (
                <div style={{
                  fontSize: "0.65rem", color: "#6b6b80",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: "0.15rem",
                }}>
                  {row.sub}
                </div>
              )}
              {row.label && !row.sub && (
                <span style={{ fontSize: "0.7rem", color: "#6b6b80", marginLeft: "0.5rem" }}>
                  {row.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: "1.5rem", textAlign: "center",
        fontSize: "0.8rem", color: "#6b6b80", lineHeight: 1.7,
      }}>
        {active === "ethereum" ? (
          <>
            <span style={{ color: "#00ff88" }}>Live now</span> — deployed and verified on {config.deployCount} EVM testnets.{" "}
            <button
              onClick={() => setActive(other)}
              style={{
                background: "none", border: "none", color: chains[other].color,
                cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem",
                fontFamily: "inherit",
              }}
            >
              See how it maps to {chains[other].name} →
            </button>
          </>
        ) : (
          <>
            <span style={{ color: "#9945FF" }}>17/17 tests passing</span> — same spec, different runtime. ASP-1 policies compile to Solana instructions instead of EVM calldata.{" "}
            The protocol is chain-agnostic. The implementation is chain-native.
          </>
        )}
      </div>
    </div>
  );
}
