import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { AgentLookup } from "./components/AgentLookup";
import { EventFeed } from "./components/EventFeed";
import { PauseButton } from "./components/PauseButton";
import { ModuleStatus } from "./components/ModuleStatus";
import { SetPolicy } from "./components/SetPolicy";
import { TokenAllowances } from "./components/TokenAllowances";
import { RevokeAgent } from "./components/RevokeAgent";

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
                marginBottom: "0.5rem",
              }}
            >
              AgentScope is how you sleep at night.
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "2rem",
                maxWidth: "600px",
                margin: "0 auto 2rem",
                lineHeight: 1.6,
              }}
            >
              Granular on-chain spending policies for AI agents. Daily limits, 
              contract whitelists, function-level permissions, ERC20 allowances,
              session expiry, and an emergency kill switch. The chain enforces 
              what you set.
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              Connect your wallet to begin.
            </p>

            {/* Feature grid for landing page */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
                marginTop: "3rem",
                textAlign: "left",
              }}
            >
              {[
                {
                  icon: "💰",
                  title: "Spending Limits",
                  desc: "Daily ETH budgets + per-transaction caps. Agent can't overspend.",
                },
                {
                  icon: "📋",
                  title: "Contract Whitelists",
                  desc: "Allow Uniswap but block everything else. Function-level granularity.",
                },
                {
                  icon: "🪙",
                  title: "Token Allowances",
                  desc: "Separate daily limits for each ERC20. USDC, DAI, whatever you need.",
                },
                {
                  icon: "⏰",
                  title: "Session Expiry",
                  desc: "Permissions auto-expire. Agent must re-request access.",
                },
                {
                  icon: "🔴",
                  title: "Emergency Pause",
                  desc: "One transaction freezes ALL agent execution. Instantly.",
                },
                {
                  icon: "👁",
                  title: "Live Event Feed",
                  desc: "Every execution, every violation, every policy change. Real-time.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="card"
                  style={{ padding: "1.25rem" }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                    {f.icon}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Connected: Full Dashboard */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <ModuleStatus />
              <PauseButton />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <AgentLookup />
                <SetPolicy />
                <TokenAllowances />
                <RevokeAgent />
              </div>
              <EventFeed />
            </div>

            {/* Footer info */}
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
              }}
            >
              <span>
                Module:{" "}
                <a
                  href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811"
                  target="_blank"
                  style={{ color: "var(--accent-blue)" }}
                >
                  0x0d003...f811
                </a>{" "}
                (Sepolia)
              </span>
              <span>Built by clio_ghost 🌀</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
