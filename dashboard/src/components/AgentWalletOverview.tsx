import { useState, useEffect } from "react";

const SEPOLIA_RPC = "https://sepolia.drpc.org";

// Common testnet token addresses on Sepolia
const TOKENS = [
  { symbol: "ETH", decimals: 18, native: true },
  { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
  { symbol: "DAI", address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574", decimals: 18 },
  { symbol: "LINK", address: "0x779877A7B0D9E8603169DdbD7836e478b4624789", decimals: 18 },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{
        background: copied ? "rgba(0,200,83,0.15)" : "rgba(255,255,255,0.06)",
        border: copied ? "1px solid rgba(0,200,83,0.3)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6, padding: "0.25rem 0.5rem", cursor: "pointer",
        fontSize: "0.7rem", color: "var(--accent-blue)", fontFamily: "monospace",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.3rem",
      }}
      title={`Copy: ${text}`}
    >
      {text.slice(0, 6)}...{text.slice(-4)}
      <span style={{ fontSize: "0.65rem" }}>{copied ? "✅" : "📋"}</span>
    </button>
  );
}

async function rpcCall(method: string, params: unknown[]) {
  const res = await fetch(SEPOLIA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json();
  return data.result;
}

export function AgentWalletOverview({ safeAddress }: { safeAddress: `0x${string}` }) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      try {
        const results: Record<string, string> = {};

        // ETH balance
        const ethHex = await rpcCall("eth_getBalance", [safeAddress, "latest"]);
        const ethWei = BigInt(ethHex || "0x0");
        results["ETH"] = (Number(ethWei) / 1e18).toFixed(4);

        // ERC20 balances
        const balanceOfSig = "0x70a08231000000000000000000000000";
        for (const token of TOKENS) {
          if (token.native) continue;
          try {
            const data = balanceOfSig + safeAddress.slice(2).toLowerCase();
            const hex = await rpcCall("eth_call", [{ to: token.address, data }, "latest"]);
            const raw = BigInt(hex || "0x0");
            const val = Number(raw) / Math.pow(10, token.decimals);
            if (val > 0) results[token.symbol] = val.toFixed(token.decimals <= 6 ? 2 : 4);
          } catch { /* skip */ }
        }

        setBalances(results);
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchBalances();
  }, [safeAddress]);

  const hasTokens = Object.keys(balances).filter(k => k !== "ETH" && parseFloat(balances[k]) > 0).length > 0;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "rgba(240,240,245,0.95)" }}>
            🔐 Agent Wallet
          </h3>
          <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
            Safe multisig on Sepolia
          </div>
        </div>
        <CopyBtn text={safeAddress} />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Loading balances...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* ETH balance - always show */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.6rem 0.75rem", borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>⟠</span>
              <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>ETH</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: "1rem", color: "rgba(240,240,245,0.95)" }}>
              {balances["ETH"] || "0.0000"}
            </span>
          </div>

          {/* ERC20 tokens with balances */}
          {hasTokens && TOKENS.filter(t => !t.native && balances[t.symbol] && parseFloat(balances[t.symbol]) > 0).map(token => (
            <div key={token.symbol} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.5rem 0.75rem", borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.9rem" }}>🪙</span>
                <span style={{ fontWeight: 500, fontSize: "0.8rem" }}>{token.symbol}</span>
              </div>
              <span style={{ fontWeight: 500, fontSize: "0.9rem", color: "rgba(240,240,245,0.85)" }}>
                {balances[token.symbol]}
              </span>
            </div>
          ))}

          {/* No tokens message */}
          {!hasTokens && (
            <div style={{
              fontSize: "0.7rem", color: "var(--text-secondary)",
              padding: "0.3rem 0.75rem",
            }}>
              No ERC-20 tokens detected. Fund with approved tokens to see balances here.
            </div>
          )}

          <a
            href={`https://sepolia.etherscan.io/address/${safeAddress}`}
            target="_blank"
            rel="noopener"
            style={{
              fontSize: "0.7rem", color: "var(--accent-blue)", textDecoration: "none",
              padding: "0.25rem 0.75rem",
            }}
          >
            View on Etherscan ↗
          </a>
        </div>
      )}
    </div>
  );
}
