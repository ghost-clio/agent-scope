import { useState } from "react";

const CONTRACT = "0x0d0034c6AC4640463bf480cB07BE770b08Bef811";

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
];

const mainnetChains = [
  { name: "Arbitrum", color: "#28A0F0" },
  { name: "Base", color: "#0052FF" },
  { name: "Optimism", color: "#FF0420" },
  { name: "Polygon", color: "#8247E5" },
  { name: "Linea", color: "#61DFFF" },
  { name: "Scroll", color: "#FFEEDA" },
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
        }}>10</div>
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

      {/* Mainnet coming soon */}
      <div style={{
        padding: "1.25rem 1.5rem", borderRadius: 16,
        background: "rgba(255,170,0,0.03)",
        border: "1px solid rgba(255,170,0,0.1)",
        display: "flex", alignItems: "center", gap: "1rem",
      }}>
        <span style={{ fontSize: "1.2rem" }}>🚀</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffaa00", marginBottom: "0.25rem" }}>
            L2 Mainnet Deployments — March 20
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {mainnetChains.map(c => (
              <span key={c.name} style={{
                fontSize: "0.7rem", color: "#6b6b80",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: c.color, opacity: 0.5,
                }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
