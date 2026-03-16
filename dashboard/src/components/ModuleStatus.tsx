import { useReadContract } from "wagmi";
import abi from "../abi.json";
// addresses passed as props

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
            {moduleAddress.slice(0, 6)}...{moduleAddress.slice(-4)}
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
            {safeAddress.slice(0, 6)}...{safeAddress.slice(-4)}
          </code>
        </div>
      </div>
    </div>
  );
}
