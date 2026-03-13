import { useReadContract } from "wagmi";
import abi from "../abi.json";
import { MODULE_ADDRESS } from "../config";

export function PauseButton() {
  const { data: paused } = useReadContract({
    address: MODULE_ADDRESS,
    abi,
    functionName: "paused",
  });

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
        onClick={() => {
          alert(
            paused
              ? "Unpause: Send setPaused(false) through your Safe"
              : "PAUSE: Send setPaused(true) through your Safe to freeze all agents"
          );
        }}
      >
        {paused ? "🟢 UNPAUSE MODULE" : "🔴 EMERGENCY PAUSE"}
      </button>
    </div>
  );
}
