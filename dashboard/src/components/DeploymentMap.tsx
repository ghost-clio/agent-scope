import { useState } from "react";

const CONTRACT = "0x0d0034c6AC4640463bf480cB07BE770b08Bef811";

const CONTRACT2 = "0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA";

const chains = [
  { name: "Ethereum Sepolia", icon: "⟠", color: "#627EEA", explorer: `https://sepolia.etherscan.io/address/${CONTRACT}` },
  { name: "Base Sepolia", icon: "🔵", color: "#0052FF", explorer: `https://sepolia.basescan.org/address/${CONTRACT}` },
  { name: "OP Sepolia", icon: "🔴", color: "#FF0420", explorer: `https://sepolia-optimism.etherscan.io/address/${CONTRACT}` },
  { name: "Arbitrum Sepolia", icon: "🔷", color: "#28A0F0", explorer: `https://sepolia.arbiscan.io/address/${CONTRACT}` },
  { name: "Polygon Amoy", icon: "🟣", color: "#8247E5", explorer: `https://amoy.polygonscan.com/address/${CONTRACT}` },
  { name: "Unichain Sepolia", icon: "🦄", color: "#FF007A", explorer: null },
  { name: "Celo Sepolia", icon: "🟡", color: "#FCFF52", explorer: `https://celo-alfajores.celoscan.io/address/${CONTRACT}` },
  { name: "Worldchain Sepolia", icon: "🌐", color: "#00C3B6", explorer: null },
  { name: "Ink Sepolia", icon: "🖋️", color: "#7B61FF", explorer: null },
  { name: "Status Network", icon: "💬", color: "#4360DF", explorer: null },
  { name: "Zora Sepolia", icon: "✦", color: "#2B5DF0", explorer: `https://sepolia.explorer.zora.energy/address/${CONTRACT2}` },
  { name: "Mode Sepolia", icon: "Ⓜ", color: "#DFFE00", explorer: `https://sepolia.explorer.mode.network/address/${CONTRACT2}` },
  { name: "Lisk Sepolia", icon: "◆", color: "#0038FF", explorer: `https://sepolia-blockscout.lisk.com/address/${CONTRACT2}` },
  { name: "Metal L2", icon: "⚙", color: "#FF6B35", explorer: `https://testnet.explorer.metall2.com/address/${CONTRACT2}` },
];

const mainnetChains = [
  { name: "Arbitrum", color: "#28A0F0", explorer: `https://arbiscan.io/address/${CONTRACT}` },
  { name: "Optimism", color: "#FF0420", explorer: `https://optimistic.etherscan.io/address/0x1AA76A89bB61B0069aa7E54c9af9D6614C756EDA` },
  { name: "Base", color: "#0052FF", explorer: `https://basescan.org/address/${CONTRACT}` },
  { name: "Celo", color: "#FCFF52", explorer: `https://celoscan.io/address/${CONTRACT}` },
  { name: "Mode", color: "#DFFE00", explorer: `https://explorer.mode.network/address/${CONTRACT}` },
  { name: "Zora", color: "#2B5DF0", explorer: `https://explorer.zora.energy/address/${CONTRACT}` },
  { name: "Lisk", color: "#0038FF", explorer: `https://blockscout.lisk.com/address/${CONTRACT}` },
  { name: "Unichain", color: "#FF007A", explorer: null },
  { name: "Worldchain", color: "#00C3B6", explorer: null },
  { name: "Ink", color: "#7B61FF", explorer: null },
  { name: "Polygon", color: "#8247E5", explorer: `https://polygonscan.com/address/0x0d3973FB015cC30A2EB7b06a0C49E1E1925DFd48` },
  { name: "Metal L2", color: "#FF6B35", explorer: `https://explorer.metall2.com/address/${CONTRACT}` },
];

export function DeploymentMap() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div>
      {/* Chain count header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "1rem", marginBottom: "2.5rem",
      }}>
        <div style={{
          fontSize: "4rem", fontWeight: 800, letterSpacing: "-0.04em",
          fontFamily: "'Space Grotesk', sans-serif",
          background: "linear-gradient(135deg, #00ff88 0%, #4488ff 50%, #8844ff 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>14</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Testnet Chains</div>
          <div style={{ fontSize: "0.8rem", color: "#6b6b80" }}>Same address. Same bytecode. One protocol.</div>
        </div>
      </div>

      {/* Contract address badge */}
      <div style={{
        textAlign: "center", marginBottom: "2rem",
      }}>
        <code style={{
          display: "inline-block",
          padding: "0.6rem 1.2rem", borderRadius: 12,
          background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)",
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem",
          color: "#00ff88", letterSpacing: "0.02em",
        }}>
          {CONTRACT}
        </code>
      </div>

      {/* Chain grid */}
      <div className="grid-5col" style={{
        marginBottom: "2rem",
      }}>
        {chains.map((chain, i) => (
          <a
            key={chain.name}
            href={chain.explorer || undefined}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.5rem", padding: "1.25rem 0.5rem",
              borderRadius: 16,
              background: hoveredIdx === i
                ? `${chain.color}12`
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${hoveredIdx === i ? `${chain.color}40` : "rgba(255,255,255,0.04)"}`,
              cursor: chain.explorer ? "pointer" : "default",
              transition: "all 0.25s ease",
              textDecoration: "none",
              transform: hoveredIdx === i ? "translateY(-2px)" : undefined,
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{chain.icon}</span>
            <span style={{
              fontSize: "0.7rem", color: hoveredIdx === i ? "#f0f0f5" : "#6b6b80",
              textAlign: "center", fontWeight: 500, lineHeight: 1.3,
              transition: "color 0.2s",
            }}>
              {chain.name}
            </span>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#00ff88",
              boxShadow: "0 0 8px rgba(0,255,136,0.4)",
            }} />
          </a>
        ))}
      </div>

      {/* Mainnet deployments LIVE */}
      <div style={{
        padding: "1.5rem", borderRadius: 16,
        background: "rgba(0,255,136,0.03)",
        border: "1px solid rgba(0,255,136,0.12)",
        marginBottom: "1rem",
      }}>
        <div style={{ 
          display: "flex", alignItems: "center", gap: "1rem",
          marginBottom: "1rem",
        }}>
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#00ff88", marginBottom: "0.25rem" }}>
              12 Mainnet Chains — LIVE
            </div>
            <div style={{ fontSize: "0.7rem", color: "#6b6b80" }}>
              Production-ready on Ethereum L2s
            </div>
          </div>
        </div>
        <div className="grid-5col">
          {mainnetChains.map((c) => (
            <a
              key={c.name}
              href={c.explorer || undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "0.35rem", padding: "0.75rem 0.35rem",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid rgba(0,255,136,0.08)`,
                cursor: c.explorer ? "pointer" : "default",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${c.color}12`;
                e.currentTarget.style.borderColor = `${c.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(0,255,136,0.08)";
              }}
            >
              <span style={{
                fontSize: "0.65rem", color: "#6b6b80",
                textAlign: "center", fontWeight: 500,
              }}>
                {c.name}
              </span>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#00ff88",
                boxShadow: "0 0 6px rgba(0,255,136,0.4)",
              }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
