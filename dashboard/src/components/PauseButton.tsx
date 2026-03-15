import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import abi from "../abi.json";
import { MODULE_ADDRESS } from "../config";

export function PauseButton() {
  const { data: paused } = useReadContract({
    address: MODULE_ADDRESS,
    abi,
    functionName: "paused",
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleTogglePause = () => {
    writeContract({
      address: MODULE_ADDRESS,
      abi,
      functionName: "setPaused",
      args: [!paused],
    });
  };

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <h2
        style={{
          margin: "0 0 0.75rem 0",
          fontSize: "1rem",
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        Emergency Controls
      </h2>
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          marginBottom: "1rem",
        }}
      >
        {paused
          ? "All agents are frozen. Unpause to resume operations."
          : "Instantly freeze ALL agent execution with one transaction."}
      </p>
      <button
        className={paused ? "btn-primary" : "btn-danger pulse-red"}
        style={{
          fontSize: "1.1rem",
          padding: "1rem 2rem",
          width: "100%",
        }}
        onClick={handleTogglePause}
        disabled={isPending || isConfirming}
      >
        {isPending
          ? "Confirm in wallet..."
          : isConfirming
          ? "Confirming..."
          : paused
          ? "🟢 UNPAUSE MODULE"
          : "🔴 EMERGENCY PAUSE"}
      </button>

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
          ✓ {paused ? "Module unpaused" : "Module paused"}
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
