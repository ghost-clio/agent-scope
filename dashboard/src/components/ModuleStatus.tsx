import { useReadContract } from "wagmi";
import { useState } from "react";
import abi from "../abi.json";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>{label}</div>
      <button
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{
          display: "flex", alignItems: "center", gap: "0.3rem",
          background: copied ? "rgba(0,200,83,0.15)" : "rgba(255,255,255,0.05)",
          border: copied ? "1px solid rgba(0,200,83,0.3)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, padding: "0.2rem 0.5rem", cursor: "pointer",
          transition: "all 0.2s",
        }}
        title={`Copy ${label.toLowerCase()}: ${text}`}
      >
        <code className="font-mono" style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>
          {text.slice(0, 6)}...{text.slice(-4)}
        </code>
        <span style={{ fontSize: "0.65rem" }}>{copied ? "✅" : "📋"}</span>
      </button>
    </div>
  );
}

export function ModuleStatus({ moduleAddress, safeAddress }: { moduleAddress: `0x${string}`; safeAddress: `0x${string}` }) {
  const { data: paused } = useReadContract({
    address: moduleAddress,
    abi,
    functionName: "paused",
  });

  useReadContract({
    address: moduleAddress,
    abi,
    functionName: "safe",
  });

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Module Status
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="status-dot" style={{ background: paused ? "var(--accent-red)" : "var(--accent-green)" }} />
            <span style={{ fontWeight: 600 }}>{paused ? "PAUSED" : "ACTIVE"}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
          <CopyButton text={safeAddress} label="Agent Wallet" />
          <CopyButton text={moduleAddress} label="Module" />
        </div>
      </div>
    </div>
  );
}
