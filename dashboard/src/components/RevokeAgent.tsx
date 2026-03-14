import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress } from "viem";
import abi from "../abi.json";
import { MODULE_ADDRESS } from "../config";

export function RevokeAgent() {
  const [agent, setAgent] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleRevoke = () => {
    if (!isAddress(agent) || !confirmed) return;
    writeContract({
      address: MODULE_ADDRESS,
      abi,
      functionName: "revokeAgent",
      args: [agent as `0x${string}`],
    });
    setConfirmed(false);
  };

  return (
    <div className="card" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
      <h2
        style={{
          margin: "0 0 0.75rem 0",
          fontSize: "1rem",
          color: "var(--accent-red)",
          fontWeight: 500,
        }}
      >
        Revoke Agent
      </h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          placeholder="0x... agent to revoke"
          value={agent}
          onChange={(e) => {
            setAgent(e.target.value);
            setConfirmed(false);
          }}
          className="font-mono"
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
      </div>

      {isAddress(agent) && !confirmed && (
        <button
          className="btn-danger"
          onClick={() => setConfirmed(true)}
          style={{ width: "100%", padding: "0.5rem" }}
        >
          Revoke Agent Permissions
        </button>
      )}

      {isAddress(agent) && confirmed && (
        <div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--accent-red)",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            ⚠ This will permanently remove all permissions for {agent.slice(0, 8)}...
            The agent will not be able to execute any transactions.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn-danger pulse-red"
              onClick={handleRevoke}
              disabled={isPending || isConfirming}
              style={{ flex: 1, padding: "0.5rem" }}
            >
              {isPending ? "Confirm..." : isConfirming ? "Revoking..." : "Yes, Revoke"}
            </button>
            <button
              className="btn-primary"
              onClick={() => setConfirmed(false)}
              style={{ flex: 1, padding: "0.5rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
          ✓ Agent revoked.
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
  );
}
