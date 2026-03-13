import { useReadContract } from "wagmi";
import abi from "../abi.json";
import { MODULE_ADDRESS, SAFE_ADDRESS } from "../config";

export function ModuleStatus() {
  const { data: paused } = useReadContract({
    address: MODULE_ADDRESS,
    abi,
    functionName: "paused",
  });

  useReadContract({
    address: MODULE_ADDRESS,
    abi,
    functionName: "safe",
  });

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Module Status
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              className="status-dot"
              style={{
                background: paused
                  ? "var(--accent-red)"
                  : "var(--accent-green)",
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {paused ? "PAUSED" : "ACTIVE"}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Module
          </div>
          <code
            className="font-mono"
            style={{ fontSize: "0.8rem", color: "var(--accent-blue)" }}
          >
            {MODULE_ADDRESS.slice(0, 6)}...{MODULE_ADDRESS.slice(-4)}
          </code>

          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: "0.5rem",
              marginBottom: "0.25rem",
            }}
          >
            Safe
          </div>
          <code
            className="font-mono"
            style={{ fontSize: "0.8rem", color: "var(--accent-blue)" }}
          >
            {SAFE_ADDRESS.slice(0, 6)}...{SAFE_ADDRESS.slice(-4)}
          </code>
        </div>
      </div>
    </div>
  );
}
