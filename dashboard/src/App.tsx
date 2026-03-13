import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { AgentLookup } from "./components/AgentLookup";
import { EventFeed } from "./components/EventFeed";
import { PauseButton } from "./components/PauseButton";
import { ModuleStatus } from "./components/ModuleStatus";

function App() {
  const { isConnected } = useAccount();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔐</span>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              AgentScope
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
              }}
            >
              Mission Control for AI Agents
            </p>
          </div>
        </div>
        <ConnectButton />
      </header>

      {/* Main */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {!isConnected ? (
          <div
            style={{
              textAlign: "center",
              marginTop: "4rem",
              padding: "3rem",
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              You gave your agent a wallet.
            </h2>
            <p
              style={{
                fontSize: "1.25rem",
                color: "var(--text-secondary)",
                marginBottom: "2rem",
              }}
            >
              AgentScope is how you sleep at night.
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              Connect your wallet to view and manage agent permissions.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Module Status */}
            <div style={{ gridColumn: "1 / -1" }}>
              <ModuleStatus />
            </div>

            {/* Agent Lookup */}
            <div>
              <AgentLookup />
            </div>

            {/* Event Feed + Pause */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <PauseButton />
              <EventFeed />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--text-secondary)",
          fontSize: "0.75rem",
          borderTop: "1px solid var(--border)",
          marginTop: "4rem",
        }}
      >
        Built by{" "}
        <a
          href="https://github.com/ghost-clio/agent-scope"
          style={{ color: "var(--accent-green)" }}
        >
          clio_ghost
        </a>{" "}
        🌀 · Sepolia Testnet ·{" "}
        <span className="font-mono" style={{ fontSize: "0.7rem" }}>
          0x0d00...f811
        </span>
      </footer>
    </div>
  );
}

export default App;
