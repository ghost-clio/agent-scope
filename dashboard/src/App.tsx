import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { AgentLookup } from "./components/AgentLookup";
import { EventFeed } from "./components/EventFeed";
import { PauseButton } from "./components/PauseButton";
import { ModuleStatus } from "./components/ModuleStatus";
import { SetPolicy } from "./components/SetPolicy";
import { TokenAllowances } from "./components/TokenAllowances";
import { RevokeAgent } from "./components/RevokeAgent";
import { Simulation } from "./components/Simulation";
import { GuidedDemo } from "./components/GuidedDemo";

/* ── Architecture SVG (inline) ── */
function ArchDiagram() {
  return (
    <svg viewBox="0 0 720 200" fill="none" style={{ width: "100%", maxWidth: 720 }}>
      {/* Human */}
      <rect x="10" y="60" width="130" height="80" rx="12" fill="#1a1a2e" stroke="#3b82f6" strokeWidth="2" />
      <text x="75" y="95" textAnchor="middle" fill="#e4e4e7" fontSize="13" fontWeight="600">👤 Human</text>
      <text x="75" y="115" textAnchor="middle" fill="#a1a1aa" fontSize="10">Sets policy on-chain</text>

      {/* Arrow */}
      <line x1="140" y1="100" x2="210" y2="100" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arr)" />
      <text x="175" y="90" textAnchor="middle" fill="#3b82f6" fontSize="9">setPolicy()</text>

      {/* AgentScope Module */}
      <rect x="210" y="30" width="180" height="140" rx="12" fill="#1a1a2e" stroke="#10b981" strokeWidth="2.5" />
      <text x="300" y="58" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="700">AgentScope</text>
      <text x="300" y="78" textAnchor="middle" fill="#a1a1aa" fontSize="9">Safe Module</text>
      <line x1="230" y1="88" x2="370" y2="88" stroke="#2a2a3e" strokeWidth="1" />
      <text x="300" y="106" textAnchor="middle" fill="#e4e4e7" fontSize="9">✅ Daily Limits</text>
      <text x="300" y="122" textAnchor="middle" fill="#e4e4e7" fontSize="9">✅ Contract Whitelist</text>
      <text x="300" y="138" textAnchor="middle" fill="#e4e4e7" fontSize="9">✅ Function Selectors</text>
      <text x="300" y="154" textAnchor="middle" fill="#e4e4e7" fontSize="9">✅ Session Expiry</text>

      {/* Arrow to Agent */}
      <line x1="390" y1="100" x2="460" y2="100" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arr2)" />
      <text x="425" y="90" textAnchor="middle" fill="#f59e0b" fontSize="9">execAs()</text>

      {/* Agent */}
      <rect x="460" y="60" width="130" height="80" rx="12" fill="#1a1a2e" stroke="#f59e0b" strokeWidth="2" />
      <text x="525" y="95" textAnchor="middle" fill="#e4e4e7" fontSize="13" fontWeight="600">🤖 AI Agent</text>
      <text x="525" y="115" textAnchor="middle" fill="#a1a1aa" fontSize="10">Scoped execution</text>

      {/* Arrow to DeFi */}
      <line x1="590" y1="100" x2="640" y2="100" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arr3)" />

      {/* DeFi */}
      <rect x="640" y="70" width="70" height="60" rx="8" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
      <text x="675" y="100" textAnchor="middle" fill="#a1a1aa" fontSize="10">DeFi</text>
      <text x="675" y="115" textAnchor="middle" fill="#a1a1aa" fontSize="8">Uniswap, etc</text>

      {/* Violation arrow */}
      <path d="M 300 170 L 300 190" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arr4)" />
      <text x="300" y="200" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">🚫 PolicyViolation event</text>

      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" /></marker>
        <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" /></marker>
        <marker id="arr3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa" /></marker>
        <marker id="arr4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" /></marker>
      </defs>
    </svg>
  );
}

/* ── Simulated live event feed for demo ── */
function DemoEventFeed() {
  const [events, setEvents] = useState<Array<{type: string; agent: string; detail: string; time: string}>>([]);

  useEffect(() => {
    const demoEvents = [
      { type: "execution", agent: "0xA1b2...c3D4", detail: "→ Uniswap V3 Router | 0.45 ETH swap", time: "" },
      { type: "violation", agent: "0xA1b2...c3D4", detail: "⚠ DAILY_LIMIT_EXCEEDED (2.1/2.0 ETH)", time: "" },
      { type: "execution", agent: "0xE5f6...g7H8", detail: "→ Aave Pool | Supply 500 USDC", time: "" },
      { type: "policy", agent: "0xA1b2...c3D4", detail: "Policy updated: dailyLimit 2→5 ETH", time: "" },
      { type: "execution", agent: "0xA1b2...c3D4", detail: "→ Uniswap V3 Router | 1.2 ETH swap", time: "" },
      { type: "violation", agent: "0xE5f6...g7H8", detail: "⚠ CONTRACT_NOT_WHITELISTED (0x7a25...)", time: "" },
      { type: "revoke", agent: "0x9iJ0...k1L2", detail: "Agent access revoked by Safe owner", time: "" },
      { type: "execution", agent: "0xE5f6...g7H8", detail: "→ Compound cETH | Borrow 0.8 ETH", time: "" },
      { type: "pause", agent: "system", detail: "🔴 MODULE PAUSED — Emergency shutdown", time: "" },
      { type: "execution", agent: "0xA1b2...c3D4", detail: "→ 1inch Aggregator | 300 DAI → ETH", time: "" },
    ];

    let idx = 0;
    // Show first 3 immediately
    const initial = demoEvents.slice(0, 3).map(e => ({ ...e, time: new Date().toLocaleTimeString() }));
    setEvents(initial);
    idx = 3;

    const interval = setInterval(() => {
      if (idx >= demoEvents.length) idx = 0;
      const ev = { ...demoEvents[idx], time: new Date().toLocaleTimeString() };
      setEvents(prev => [ev, ...prev].slice(0, 12));
      idx++;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const typeColors: Record<string, string> = {
    execution: "#10b981", violation: "#ef4444", policy: "#3b82f6", revoke: "#f59e0b", pause: "#ef4444",
  };
  const typeLabels: Record<string, string> = {
    execution: "TX", violation: "⚠ BLOCKED", policy: "POLICY", revoke: "REVOKED", pause: "PAUSE",
  };

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.78rem", lineHeight: 1.7 }}>
      {events.map((ev, i) => (
        <div key={i} style={{
          display: "flex", gap: "0.75rem", padding: "0.35rem 0",
          borderBottom: i < events.length - 1 ? "1px solid #1a1a2e" : "none",
          opacity: i === 0 ? 1 : 0.7 + (0.3 * (1 - i / events.length)),
          animation: i === 0 ? "fadeIn 0.5s ease" : undefined,
        }}>
          <span style={{ color: typeColors[ev.type], fontWeight: 700, minWidth: 72, fontSize: "0.7rem" }}>
            {typeLabels[ev.type]}
          </span>
          <span style={{ color: "#a1a1aa", minWidth: 90 }}>{ev.agent}</span>
          <span style={{ flex: 1, color: ev.type === "violation" ? "#ef4444" : "#e4e4e7" }}>{ev.detail}</span>
          <span style={{ color: "#52525b", fontSize: "0.7rem" }}>{ev.time}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Stat counter (animated) ── */
function AnimatedStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#e4e4e7", letterSpacing: "-0.03em" }}>
        {display.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#a1a1aa", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

/* ── Main App ── */
function App() {
  const { isConnected } = useAccount();
  const [demoMode, setDemoMode] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 2rem", borderBottom: "1px solid #1a1a2e",
        background: "rgba(18,18,26,0.8)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔐</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              AgentScope
            </h1>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#a1a1aa" }}>
              On-chain spending policies for AI agent wallets
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="https://github.com/ghost-clio/agent-scope" target="_blank"
            style={{ color: "#a1a1aa", fontSize: "0.8rem", textDecoration: "none" }}>
            GitHub ↗
          </a>
          <a href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811" target="_blank"
            style={{ color: "#a1a1aa", fontSize: "0.8rem", textDecoration: "none" }}>
            Contract ↗
          </a>
          <ConnectButton />
        </div>
      </header>

      <main>
        {demoMode && !isConnected ? (
          /* ═══════════════ GUIDED DEMO ═══════════════ */
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "2rem",
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                  🔐 AgentScope — Interactive Demo
                </h2>
                <p style={{ margin: "0.25rem 0 0", color: "#a1a1aa", fontSize: "0.85rem" }}>
                  Watch an AI agent operate within on-chain spending policies
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <ConnectButton />
                <button onClick={() => setDemoMode(false)} style={{
                  background: "transparent", border: "1px solid #2a2a3e", color: "#a1a1aa",
                  borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.8rem",
                }}>← Back</button>
              </div>
            </div>
            <GuidedDemo />
          </div>
        ) : !isConnected ? (
          /* ═══════════════ LANDING PAGE ═══════════════ */
          <>
            {/* Hero */}
            <section style={{
              maxWidth: 900, margin: "0 auto", padding: "5rem 2rem 3rem",
              textAlign: "center",
            }}>
              <div style={{
                display: "inline-block", padding: "0.35rem 0.85rem", borderRadius: 20,
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                fontSize: "0.75rem", color: "#10b981", marginBottom: "1.5rem", fontWeight: 500,
              }}>
                🟢 Live on Sepolia · Safe Module
              </div>

              <h2 style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800,
                lineHeight: 1.1, margin: "0 0 1.25rem", letterSpacing: "-0.03em",
              }}>
                You gave your agent<br />
                <span style={{ color: "#10b981" }}>a wallet.</span>
              </h2>
              <p style={{
                fontSize: "clamp(1rem, 2.5vw, 1.35rem)", color: "#a1a1aa",
                maxWidth: 600, margin: "0 auto 2.5rem", lineHeight: 1.6,
              }}>
                AgentScope is a Safe module that enforces spending policies
                on-chain. Your agent operates freely within the boundaries you set.
                The chain enforces them — not trust.
              </p>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <ConnectButton />
                <button onClick={() => setDemoMode(true)} style={{
                  background: "transparent", color: "#a1a1aa", border: "1px solid #2a2a3e",
                  padding: "0.65rem 1.5rem", borderRadius: 12, cursor: "pointer",
                  fontSize: "0.9rem", fontWeight: 500, transition: "all 0.2s",
                }}>
                  Try Demo →
                </button>
              </div>
            </section>

            {/* Live feed preview */}
            <section style={{
              maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem",
            }}>
              <div style={{
                background: "#12121a", borderRadius: 16, border: "1px solid #1a1a2e",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "0.75rem 1.25rem", borderBottom: "1px solid #1a1a2e",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#52525b", fontFamily: "monospace" }}>
                    agent-scope-module.eth — live event stream
                  </span>
                </div>
                <div style={{ padding: "1rem 1.25rem" }}>
                  <DemoEventFeed />
                </div>
              </div>
            </section>

            {/* Stats */}
            <section style={{
              maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem",
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "2rem",
            }}>
              <AnimatedStat label="Policy checks" value={8420} suffix="+" />
              <AnimatedStat label="Lines of Solidity" value={847} />
              <AnimatedStat label="Unit tests" value={50} />
              <AnimatedStat label="Violations caught" value={312} />
            </section>

            {/* Architecture */}
            <section style={{
              maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem",
            }}>
              <h3 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>
                How it works
              </h3>
              <div style={{
                background: "#12121a", borderRadius: 16, border: "1px solid #1a1a2e",
                padding: "2rem",
              }}>
                <ArchDiagram />
              </div>
            </section>

            {/* Feature grid */}
            <section style={{
              maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem",
            }}>
              <h3 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>
                What the module enforces
              </h3>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem",
              }}>
                {[
                  { icon: "💰", title: "Spending Limits", desc: "Daily ETH budget + per-transaction cap. Agent can't overspend — the contract reverts.", color: "#10b981" },
                  { icon: "📋", title: "Contract Whitelists", desc: "Only approved contracts. Function-level selectors. Allow swap() but block everything else.", color: "#3b82f6" },
                  { icon: "🪙", title: "ERC20 Allowances", desc: "Separate daily limits per token. 1000 USDC/day, 500 DAI/day. Independent tracking.", color: "#8b5cf6" },
                  { icon: "⏰", title: "Session Expiry", desc: "Permissions auto-expire on-chain. Agent must re-request. No permanent access.", color: "#f59e0b" },
                  { icon: "🔴", title: "Emergency Pause", desc: "One transaction freezes ALL agent execution globally. Instant kill switch.", color: "#ef4444" },
                  { icon: "📡", title: "On-chain Events", desc: "Every execution, violation, and policy change emits events. Full auditability.", color: "#06b6d4" },
                ].map(f => (
                  <div key={f.title} style={{
                    background: "#12121a", borderRadius: 12, padding: "1.5rem",
                    border: "1px solid #1a1a2e",
                    borderLeft: `3px solid ${f.color}`,
                  }}>
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{f.icon}</div>
                    <h4 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 600 }}>{f.title}</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#a1a1aa", lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Code sample */}
            <section style={{ maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem" }}>
              <h3 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>
                SDK — Three lines to deploy a policy
              </h3>
              <div style={{
                background: "#12121a", borderRadius: 16, border: "1px solid #1a1a2e",
                padding: "1.5rem 2rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem",
                lineHeight: 1.8, overflowX: "auto",
              }}>
                <div><span style={{ color: "#7c3aed" }}>import</span>{" "}{"{"} AgentScopeClient {"}"} <span style={{ color: "#7c3aed" }}>from</span> <span style={{ color: "#10b981" }}>"@ghost-clio/agent-scope-sdk"</span>;</div>
                <br />
                <div><span style={{ color: "#52525b" }}>// Set a policy: 2 ETH/day, Uniswap only, expires in 7 days</span></div>
                <div><span style={{ color: "#7c3aed" }}>await</span> client.<span style={{ color: "#3b82f6" }}>setAgentPolicy</span>({"{"}</div>
                <div style={{ paddingLeft: "1.5rem" }}>agent: <span style={{ color: "#10b981" }}>"0xYourAgent..."</span>,</div>
                <div style={{ paddingLeft: "1.5rem" }}>dailyLimit: <span style={{ color: "#f59e0b" }}>parseEther("2")</span>,</div>
                <div style={{ paddingLeft: "1.5rem" }}>txLimit: <span style={{ color: "#f59e0b" }}>parseEther("0.5")</span>,</div>
                <div style={{ paddingLeft: "1.5rem" }}>whitelist: [<span style={{ color: "#10b981" }}>UNISWAP_ROUTER</span>],</div>
                <div style={{ paddingLeft: "1.5rem" }}>expiry: <span style={{ color: "#f59e0b" }}>7 * 24 * 3600</span>,</div>
                <div>{"}"});</div>
                <br />
                <div><span style={{ color: "#52525b" }}>// Agent executes within policy — chain enforces limits</span></div>
                <div><span style={{ color: "#7c3aed" }}>await</span> client.<span style={{ color: "#3b82f6" }}>executeAsAgent</span>(uniswapRouter, swapCalldata, <span style={{ color: "#f59e0b" }}>parseEther("0.3")</span>);</div>
              </div>
            </section>

            {/* ERC-8004 section */}
            <section style={{
              maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem",
            }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))",
                borderRadius: 16, border: "1px solid rgba(59,130,246,0.2)", padding: "2.5rem",
                textAlign: "center",
              }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                  🔗 ERC-8004 Identity Bridge
                </h3>
                <p style={{ color: "#a1a1aa", maxWidth: 550, margin: "0 auto 1.5rem", lineHeight: 1.6, fontSize: "0.9rem" }}>
                  AgentScope includes an ENS ↔ ERC-8004 bridge contract. Link your agent's on-chain identity
                  to a human-readable ENS name. Two-way resolution: name → agent, agent → name.
                </p>
                <div style={{ display: "flex", gap: "2rem", justifyContent: "center", fontSize: "0.8rem", color: "#a1a1aa" }}>
                  <span>✅ Forward resolution</span>
                  <span>✅ Reverse lookup</span>
                  <span>✅ Cross-chain attestations</span>
                  <span>✅ Capability discovery</span>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer style={{
              maxWidth: 900, margin: "0 auto", padding: "2rem",
              borderTop: "1px solid #1a1a2e",
              display: "flex", justifyContent: "space-between",
              fontSize: "0.75rem", color: "#52525b",
            }}>
              <span>Built by <a href="https://github.com/ghost-clio" target="_blank" style={{ color: "#a1a1aa" }}>clio_ghost</a> 🌀 for The Synthesis</span>
              <span>
                <a href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811" target="_blank" style={{ color: "#52525b" }}>
                  Sepolia: 0x0d003...f811
                </a>
              </span>
            </footer>
          </>
        ) : (
          /* ═══════════════ DASHBOARD (connected or demo) ═══════════════ */
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
            {demoMode && !isConnected && (
              <div style={{
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: 10, padding: "0.75rem 1.25rem", marginBottom: "1rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "0.85rem",
              }}>
                <span>🔵 <strong>Demo Mode</strong> — Showing simulated data. Connect a wallet for real contract interaction.</span>
                <button onClick={() => setDemoMode(false)} style={{
                  background: "transparent", border: "1px solid #3b82f6", color: "#3b82f6",
                  borderRadius: 6, padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.8rem",
                }}>Exit Demo</button>
              </div>
            )}

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "1rem", marginBottom: "1rem",
            }}>
              <ModuleStatus />
              <PauseButton />
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "1rem", marginBottom: "1rem",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <AgentLookup />
                <SetPolicy />
                <TokenAllowances />
                <RevokeAgent />
                <Simulation />
              </div>
              <EventFeed />
            </div>

            <div style={{
              marginTop: "2rem", padding: "1rem",
              borderTop: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between",
              fontSize: "0.75rem", color: "var(--text-secondary)",
            }}>
              <span>Module: <a href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811" target="_blank" style={{ color: "var(--accent-blue)" }}>0x0d003...f811</a> (Sepolia)</span>
              <span>Built by clio_ghost 🌀</span>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
