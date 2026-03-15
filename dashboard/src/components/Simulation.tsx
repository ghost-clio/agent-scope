import { useState } from "react";
import { useReadContract } from "wagmi";
import { parseEther, isAddress } from "viem";
import abi from "../abi.json";
import { MODULE_ADDRESS } from "../config";

interface SimResult {
  allowed: boolean;
  reason: string;
}

export function Simulation() {
  const [agent, setAgent] = useState("");
  const [target, setTarget] = useState("");
  const [value, setValue] = useState("0.1");
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  // Pre-flight permission check
  const { refetch, isFetching } = useReadContract({
    address: MODULE_ADDRESS,
    abi,
    functionName: "checkPermission",
    args:
      isAddress(agent) && isAddress(target)
        ? [
            agent as `0x${string}`,
            target as `0x${string}`,
            parseEther(value || "0"),
            "0x" as `0x${string}`,
          ]
        : undefined,
    query: { enabled: false },
  });

  const handleSimulate = async () => {
    if (!isAddress(agent) || !isAddress(target)) {
      setResult({ allowed: false, reason: "Invalid address" });
      return;
    }

    try {
      const res = await refetch();
      if (res.data !== undefined) {
        const [allowed, reason] = res.data as [boolean, string];
        setResult({ allowed, reason: reason || (allowed ? "Transaction would succeed" : "Blocked by policy") });
      } else if (res.error) {
        setResult({
          allowed: false,
          reason: (res.error as any).shortMessage || res.error.message || "Contract call failed",
        });
      }
    } catch (e: any) {
      setResult({
        allowed: false,
        reason: e.shortMessage || e.message || "Simulation failed",
      });
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
          🧪 Simulate Transaction
        </h2>
        <span style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
          {expanded ? "▾" : "▸"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: "1rem" }}>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: "1rem",
              lineHeight: 1.5,
            }}
          >
            Test whether a transaction would be allowed under the current policy
            without sending anything on-chain. Uses the contract's{" "}
            <code style={{ color: "var(--accent-blue)" }}>checkPermission</code>{" "}
            function.
          </p>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Agent Address (who's sending)</label>
            <input
              type="text"
              placeholder="0x..."
              value={agent}
              onChange={(e) => {
                setAgent(e.target.value);
                setResult(null);
              }}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Target Contract (where to)</label>
            <input
              type="text"
              placeholder="0x..."
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setResult(null);
              }}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Value (ETH)</label>
            <input
              type="number"
              value={value}
              step="0.01"
              onChange={(e) => {
                setValue(e.target.value);
                setResult(null);
              }}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSimulate}
            disabled={!isAddress(agent) || !isAddress(target) || isFetching}
            style={{ width: "100%", padding: "0.75rem" }}
          >
            {isFetching ? "Simulating..." : "🧪 Simulate"}
          </button>

          {result && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: result.allowed
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${
                  result.allowed
                    ? "var(--accent-green)"
                    : "var(--accent-red)"
                }`,
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>
                  {result.allowed ? "✅" : "🚫"}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: result.allowed
                      ? "var(--accent-green)"
                      : "var(--accent-red)",
                  }}
                >
                  {result.allowed ? "WOULD SUCCEED" : "WOULD BE BLOCKED"}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                }}
              >
                {result.reason}
              </p>
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
