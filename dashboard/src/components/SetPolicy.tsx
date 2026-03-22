import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress, encodeFunctionData } from "viem";
import abi from "../abi.json";
import mockSafeAbi from "../abi-mocksafe.json";

export function SetPolicy({ moduleAddress, safeAddress }: { moduleAddress: `0x${string}`; safeAddress: `0x${string}` }) {
  const [agent, setAgent] = useState("");
  const [dailyLimit, setDailyLimit] = useState("0.5");
  const [perTxLimit, setPerTxLimit] = useState("0.1");
  const [expiryHours, setExpiryHours] = useState("24");
  const [contracts, setContracts] = useState("");
  const [functions, setFunctions] = useState("");
  const [expanded, setExpanded] = useState(true);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = () => {
    if (!isAddress(agent)) return;

    const expiry = expiryHours === "0"
      ? 0n
      : BigInt(Math.floor(Date.now() / 1000) + parseInt(expiryHours) * 3600);

    const contractList = contracts
      .split(",")
      .map((s) => s.trim())
      .filter((s) => isAddress(s)) as `0x${string}`[];

    const fnList = functions
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("0x") && s.length === 10) as `0x${string}`[];

    // Encode the setAgentPolicy call, then route through Safe.callModule
    const policyCalldata = encodeFunctionData({
      abi,
      functionName: "setAgentPolicy",
      args: [
        agent as `0x${string}`,
        parseEther(dailyLimit),
        parseEther(perTxLimit || "0"),
        expiry,
        contractList,
        fnList,
      ],
    });

    writeContract({
      address: safeAddress,
      abi: mockSafeAbi.abi,
      functionName: "callModule",
      args: [moduleAddress, policyCalldata],
    });
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
          Grant Agent Permissions
        </h2>
        <span style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
          {expanded ? "▾" : "▸"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: "1rem" }}>
          {/* Agent Address */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Agent Address</label>
            <input
              type="text"
              placeholder="0x... the agent's EOA"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          {/* Limits Row */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Daily Limit (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="font-mono"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Per-Tx Limit (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={perTxLimit}
                onChange={(e) => setPerTxLimit(e.target.value)}
                className="font-mono"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Expires In (hours)</label>
              <input
                type="number"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="font-mono"
                style={inputStyle}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                0 = never
              </span>
            </div>
          </div>

          {/* Advanced: Whitelists */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Allowed Contracts (comma-separated, empty = any)</label>
            <input
              type="text"
              placeholder="0xUniswapRouter, 0xAavePool..."
              value={contracts}
              onChange={(e) => setContracts(e.target.value)}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Allowed Functions (selectors, empty = any)</label>
            <input
              type="text"
              placeholder="0x38ed1739, 0xa9059cbb..."
              value={functions}
              onChange={(e) => setFunctions(e.target.value)}
              className="font-mono"
              style={inputStyle}
            />
          </div>

          {/* Summary */}
          {isAddress(agent) && (
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "1rem",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--accent-blue)" }}>
                Policy Preview
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                Agent <code className="font-mono">{agent.slice(0, 8)}...</code> can spend up to{" "}
                <strong>{dailyLimit} ETH/day</strong>
                {perTxLimit !== "0" && <>, max <strong>{perTxLimit} ETH/tx</strong></>}
                {expiryHours !== "0" && <>, expiring in <strong>{expiryHours}h</strong></>}
                {contracts && <>, restricted to <strong>{contracts.split(",").length} contracts</strong></>}
                {functions && <>, <strong>{functions.split(",").length} functions</strong> only</>}
                .
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!isAddress(agent) || isPending || isConfirming}
            style={{ width: "100%", padding: "0.75rem" }}
          >
            {isPending
              ? "Confirm in wallet..."
              : isConfirming
              ? "Confirming..."
              : "Set Agent Policy"}
          </button>

          {/* Status */}
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
              ✓ Policy set! Agent is now scoped.
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
