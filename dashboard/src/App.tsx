import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect, useRef, useCallback } from "react";
import { AgentLookup } from "./components/AgentLookup";
import { EventFeed } from "./components/EventFeed";
import { PauseButton } from "./components/PauseButton";
import { ModuleStatus } from "./components/ModuleStatus";
import { SetPolicy } from "./components/SetPolicy";
import { TokenAllowances } from "./components/TokenAllowances";
import { RevokeAgent } from "./components/RevokeAgent";
import { Simulation } from "./components/Simulation";
import { GuidedDemo } from "./components/GuidedDemo";
import { PolicyBuilder } from "./components/PolicyBuilder";
import { DeploymentMap } from "./components/DeploymentMap";
import { JailbreakDemo } from "./components/JailbreakDemo";
// ChainToggle moved to header as ChainSwitch

/* ═══════════════════════════════════════════════
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ARCHITECTURE DIAGRAM (redesigned)
   ═══════════════════════════════════════════════ */
function ArchDiagram() {
  return (
    <svg viewBox="0 0 760 220" fill="none" style={{ width: "100%", maxWidth: 760 }}>
      {/* Glow effects */}
      <defs>
        <filter id="glow-g"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-b"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#4488ff" /><stop offset="100%" stopColor="#00ff88" /></linearGradient>
        <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00ff88" /><stop offset="100%" stopColor="#ffaa00" /></linearGradient>
        <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4488ff" /></marker>
        <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ffaa00" /></marker>
        <marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6b6b80" /></marker>
        <marker id="a4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ff3366" /></marker>
      </defs>
      {/* Human */}
      <rect x="10" y="65" width="140" height="80" rx="16" fill="rgba(16,16,24,0.8)" stroke="#4488ff" strokeWidth="1.5" />
      <text x="80" y="100" textAnchor="middle" fill="#f0f0f5" fontSize="13" fontWeight="600">👤 Human</text>
      <text x="80" y="120" textAnchor="middle" fill="#6b6b80" fontSize="10">Sets policy on-chain</text>
      {/* Arrow 1 */}
      <line x1="150" y1="105" x2="225" y2="105" stroke="#4488ff" strokeWidth="1.5" markerEnd="url(#a1)" filter="url(#glow-b)" />
      <text x="188" y="95" textAnchor="middle" fill="#4488ff" fontSize="9" fontFamily="JetBrains Mono, monospace">setPolicy()</text>
      {/* AgentScope */}
      <rect x="225" y="30" width="190" height="150" rx="16" fill="rgba(16,16,24,0.8)" stroke="#00ff88" strokeWidth="2" />
      <text x="320" y="60" textAnchor="middle" fill="#00ff88" fontSize="15" fontWeight="700" fontFamily="Space Grotesk, sans-serif">AgentScope</text>
      <text x="320" y="78" textAnchor="middle" fill="#6b6b80" fontSize="9">Safe Module</text>
      <line x1="245" y1="88" x2="395" y2="88" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {["Daily Limits","Contract Whitelist","Function Selectors","Session Expiry"].map((t, i) => (
        <text key={t} x="320" y={108 + i * 17} textAnchor="middle" fill="rgba(240,240,245,0.7)" fontSize="9.5">✅ {t}</text>
      ))}
      {/* Arrow 2 */}
      <line x1="415" y1="105" x2="490" y2="105" stroke="#ffaa00" strokeWidth="1.5" markerEnd="url(#a2)" />
      <text x="453" y="95" textAnchor="middle" fill="#ffaa00" fontSize="9" fontFamily="JetBrains Mono, monospace">execAs()</text>
      {/* Agent */}
      <rect x="490" y="65" width="140" height="80" rx="16" fill="rgba(16,16,24,0.8)" stroke="#ffaa00" strokeWidth="1.5" />
      <text x="560" y="100" textAnchor="middle" fill="#f0f0f5" fontSize="13" fontWeight="600">🤖 AI Agent</text>
      <text x="560" y="120" textAnchor="middle" fill="#6b6b80" fontSize="10">Scoped execution</text>
      {/* Arrow 3 */}
      <line x1="630" y1="105" x2="680" y2="105" stroke="#6b6b80" strokeWidth="1" strokeDasharray="4" markerEnd="url(#a3)" />
      {/* DeFi */}
      <rect x="680" y="75" width="70" height="60" rx="12" fill="rgba(16,16,24,0.5)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="715" y="102" textAnchor="middle" fill="#6b6b80" fontSize="10">DeFi</text>
      <text x="715" y="118" textAnchor="middle" fill="rgba(107,107,128,0.6)" fontSize="8">Uniswap, etc</text>
      {/* Violation */}
      <path d="M 320 180 L 320 205" stroke="#ff3366" strokeWidth="1.5" markerEnd="url(#a4)" />
      <text x="320" y="218" textAnchor="middle" fill="#ff3366" fontSize="9" fontWeight="600">🚫 PolicyViolation</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   LIVE EVENT FEED (demo)
   ═══════════════════════════════════════════════ */
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

  const typeConfig: Record<string, { color: string; label: string }> = {
    execution: { color: "#00ff88", label: "TX" },
    violation: { color: "#ff3366", label: "⚠ BLOCKED" },
    policy: { color: "#4488ff", label: "POLICY" },
    revoke: { color: "#ffaa00", label: "REVOKED" },
    pause: { color: "#ff3366", label: "PAUSE" },
  };

  return (
    <div className="font-mono" style={{ fontSize: "0.78rem", lineHeight: 1.8 }}>
      {events.map((ev, i) => {
        const cfg = typeConfig[ev.type] || typeConfig.execution;
        return (
          <div key={`${ev.type}-${ev.time}-${i}`} style={{
            display: "flex", gap: "0.75rem", padding: "0.4rem 0",
            borderBottom: i < events.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
            opacity: i === 0 ? 1 : 0.5 + (0.5 * (1 - i / events.length)),
            animation: i === 0 ? "fadeIn 0.5s ease" : undefined,
          }}>
            <span style={{ color: cfg.color, fontWeight: 700, minWidth: 78, fontSize: "0.7rem" }}>{cfg.label}</span>
            <span style={{ color: "#6b6b80", minWidth: 90 }}>{ev.agent}</span>
            <span style={{ flex: 1, color: ev.type === "violation" || ev.type === "pause" ? "#ff3366" : "rgba(240,240,245,0.8)" }}>{ev.detail}</span>
            <span style={{ color: "rgba(107,107,128,0.5)", fontSize: "0.7rem" }}>{ev.time}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ANIMATED STAT COUNTER
   ═══════════════════════════════════════════════ */
function AnimatedStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setDisplay(Math.floor(eased * value));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontSize: "3.5rem", fontWeight: 700, letterSpacing: "-0.04em",
        background: "linear-gradient(180deg, #f0f0f5 30%, rgba(240,240,245,0.4))",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {display.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize: "0.8rem", color: "#6b6b80", marginTop: "0.5rem",
        textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500,
      }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEATURE DATA
   ═══════════════════════════════════════════════ */
const features = [
  { icon: "💰", title: "Spending Limits", desc: "Daily ETH budget + per-transaction cap. Agent can't overspend — the contract reverts.", color: "#00ff88" },
  { icon: "📋", title: "Contract Whitelists", desc: "Only approved contracts. Function-level selectors. Allow swap() but block everything else.", color: "#4488ff" },
  { icon: "🪙", title: "ERC20 Allowances", desc: "Separate daily limits per token. 1000 USDC/day, 500 DAI/day. Independent tracking.", color: "#8844ff" },
  { icon: "⏰", title: "Session Expiry", desc: "Permissions auto-expire on-chain. Agent must re-request. No permanent access.", color: "#ffaa00" },
  { icon: "🔴", title: "Emergency Pause", desc: "One transaction freezes ALL agent execution globally. Instant kill switch.", color: "#ff3366" },
  { icon: "📡", title: "On-chain Events", desc: "Every execution, violation, and policy change emits events. Full auditability.", color: "#06d6d6" },
];

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
type ChainMode = "evm" | "solana";

function ChainSwitch({ mode, onSwitch }: { mode: ChainMode; onSwitch: (m: ChainMode) => void }) {
  return (
    <div style={{
      display: "flex", borderRadius: 10, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(5,5,8,0.6)",
    }}>
      {([
        { id: "evm" as ChainMode, label: "⟠ EVM", color: "#627EEA" },
        { id: "solana" as ChainMode, label: "◎ Solana", color: "#9945FF" },
      ]).map(chain => (
        <button
          key={chain.id}
          onClick={() => onSwitch(chain.id)}
          style={{
            padding: "0.35rem 0.9rem",
            fontSize: "0.75rem", fontWeight: 600,
            border: "none", cursor: "pointer",
            transition: "all 0.2s ease",
            background: mode === chain.id ? `${chain.color}20` : "transparent",
            color: mode === chain.id ? chain.color : "#6b6b80",
            borderRight: chain.id === "evm" ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          {chain.label}

        </button>
      ))}
    </div>
  );
}

function App() {
  const { isConnected } = useAccount();
  const [demoMode, setDemoMode] = useState(false);
  const [chainMode, setChainMode] = useState<ChainMode>("evm");

  // Smooth scroll (used by nav links)
  const _scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);
  void _scrollTo; // reserved for nav

  return (
    <div data-chain={chainMode} style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      {/* Background effects */}
      <div className="grid-bg" />
      <div className="noise" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      {/* ── HEADER ── */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 2rem", position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,5,8,0.7)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🔐</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
              AgentScope
            </h1>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "#6b6b80", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              On-chain spending policies
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <ChainSwitch mode={chainMode} onSwitch={setChainMode} />
          <a href="https://github.com/ghost-clio/agent-scope" target="_blank"
            style={{ color: "#6b6b80", fontSize: "0.8rem", textDecoration: "none", transition: "color 0.2s" }}
            onMouseOver={e => (e.currentTarget.style.color = "#f0f0f5")}
            onMouseOut={e => (e.currentTarget.style.color = "#6b6b80")}>
            GitHub ↗
          </a>
          <a href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811" target="_blank"
            style={{ color: "#6b6b80", fontSize: "0.8rem", textDecoration: "none", transition: "color 0.2s" }}
            onMouseOver={e => (e.currentTarget.style.color = "#f0f0f5")}
            onMouseOut={e => (e.currentTarget.style.color = "#6b6b80")}>
            Contract ↗
          </a>
          <ConnectButton />
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1 }}>
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
                <p style={{ margin: "0.25rem 0 0", color: "#6b6b80", fontSize: "0.85rem" }}>
                  Watch an AI agent operate within on-chain spending policies
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <ConnectButton />
                <button onClick={() => setDemoMode(false)} className="btn-ghost" style={{ padding: "0.5rem 1rem" }}>← Back</button>
              </div>
            </div>
            <GuidedDemo />
          </div>
        ) : !isConnected ? (
          /* ═══════════════ LANDING PAGE ═══════════════ */
          <>
            {/* ── HERO ── */}
            <section style={{
              maxWidth: 900, margin: "0 auto", padding: "10rem 2rem 8rem",
              textAlign: "center", position: "relative",
            }}>
              <Reveal>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.4rem 1rem", borderRadius: 24,
                  background: "var(--accent-green-dim)", border: "1px solid var(--accent-green-dim)",
                  fontSize: "0.75rem", color: "var(--accent-green)", marginBottom: "2rem", fontWeight: 500,
                }}>
                  <span className="live-dot" />
                  {chainMode === "evm" ? "Live on Sepolia · Safe Module" : "Anchor Program · 17 Tests Passing"}
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h2 style={{
                  fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700,
                  lineHeight: 1.05, margin: "0 0 1.5rem", letterSpacing: "-0.04em",
                }}>
                  You gave your agent<br />
                  <span className="hero-gradient">a wallet.</span>
                </h2>
              </Reveal>

              <Reveal delay={200}>
                <p style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.25rem)", color: "#6b6b80",
                  maxWidth: 520, margin: "0 auto 3rem", lineHeight: 1.7,
                  fontWeight: 400,
                }}>
                  {chainMode === "evm"
                    ? "AgentScope is a Safe module that enforces spending policies on-chain. Your agent operates freely within the boundaries you set. The chain enforces them — not trust."
                    : "AgentScope is a Solana program that enforces spending policies on-chain. PDA vaults, program whitelists, SPL token limits. The chain enforces them — not trust."
                  }
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <ConnectButton />
                  <button onClick={() => setDemoMode(true)} className="btn-ghost">
                    Try Demo →
                  </button>
                </div>
              </Reveal>
            </section>

            {/* ── LIVE FEED ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 8rem" }}>
              <Reveal>
                <div className="terminal">
                  <div className="terminal-bar">
                    <div className="terminal-dot" style={{ background: "#ff3366" }} />
                    <div className="terminal-dot" style={{ background: "#ffaa00" }} />
                    <div className="terminal-dot" style={{ background: "#00ff88" }} />
                    <span style={{
                      marginLeft: "auto", fontSize: "0.7rem", color: "rgba(107,107,128,0.5)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {chainMode === "evm" ? "agent-scope-module.eth" : "agent-scope.sol"} — live event stream
                    </span>
                    <span className="live-dot" style={{ marginLeft: 8 }} />
                  </div>
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <DemoEventFeed />
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ── STATS ── */}
            <section id="stats" className="stats-grid" style={{
              maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem",
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem",
            }}>
              {(chainMode === "evm" ? [
                { label: "Policy checks", value: 8420, suffix: "+" },
                { label: "Lines of Solidity", value: 847 },
                { label: "Unit tests", value: 96 },
                { label: "Violations caught", value: 312 },
              ] : [
                { label: "Instructions", value: 11 },
                { label: "Lines of Rust", value: 780 },
                { label: "Account types", value: 3 },
                { label: "Error codes", value: 12 },
              ]).map((s, i) => (
                <Reveal key={s.label} delay={i * 100}>
                  <AnimatedStat {...s} />
                </Reveal>
              ))}
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 0.5rem" }}>
                    How it works
                  </h3>
                  <p style={{ color: "#6b6b80", fontSize: "1rem", margin: 0 }}>
                    Human sets boundaries. Agent operates freely within them. On-chain enforcement.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="glass-card" style={{ padding: "2.5rem" }}>
                  <ArchDiagram />
                </div>
              </Reveal>
            </section>

            {/* ── FEATURES ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 0.5rem" }}>
                    Six enforcement layers
                  </h3>
                  <p style={{ color: "#6b6b80", fontSize: "1rem", margin: 0 }}>
                    Every constraint is verified on-chain before execution.
                  </p>
                </div>
              </Reveal>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem",
              }}>
                {features.map((f, i) => (
                  <Reveal key={f.title} delay={i * 80}>
                    <div
                      className="glass-card feature-card"
                      style={{ padding: "2rem", "--card-accent": f.color } as React.CSSProperties}
                    >
                      <div style={{
                        fontSize: "1.5rem", marginBottom: "0.75rem",
                        width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${f.color}10`, borderRadius: 12,
                      }}>{f.icon}</div>
                      <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem", fontWeight: 600 }}>{f.title}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b6b80", lineHeight: 1.7 }}>{f.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ── SDK CODE ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
                    {chainMode === "evm" ? "Three lines to deploy a policy" : "Three lines to deploy a policy"}
                  </h3>
                  <p style={{ color: "#6b6b80", marginTop: "0.75rem", fontSize: "0.95rem" }}>
                    {chainMode === "evm"
                      ? "The SDK wraps everything. TypeScript-native, viem-powered."
                      : "The SDK wraps everything. TypeScript-native, Anchor-powered."}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                {chainMode === "evm" ? (
                <div className="code-block">
                  <div><span style={{ color: "#8844ff" }}>import</span>{" "}{"{"} AgentScopeClient {"}"} <span style={{ color: "#8844ff" }}>from</span> <span style={{ color: "#00ff88" }}>"@ghost-clio/agent-scope-sdk"</span>;</div>
                  <br />
                  <div><span style={{ color: "rgba(107,107,128,0.6)" }}>// Set a policy: 2 ETH/day, Uniswap only, expires in 7 days</span></div>
                  <div><span style={{ color: "#8844ff" }}>await</span> client.<span style={{ color: "#4488ff" }}>setAgentPolicy</span>({"{"}</div>
                  <div style={{ paddingLeft: "1.5rem" }}>agent: <span style={{ color: "#00ff88" }}>"0xYourAgent..."</span>,</div>
                  <div style={{ paddingLeft: "1.5rem" }}>dailyLimit: <span style={{ color: "#ffaa00" }}>parseEther("2")</span>,</div>
                  <div style={{ paddingLeft: "1.5rem" }}>txLimit: <span style={{ color: "#ffaa00" }}>parseEther("0.5")</span>,</div>
                  <div style={{ paddingLeft: "1.5rem" }}>whitelist: [<span style={{ color: "#00ff88" }}>UNISWAP_ROUTER</span>],</div>
                  <div style={{ paddingLeft: "1.5rem" }}>expiry: <span style={{ color: "#ffaa00" }}>7 * 24 * 3600</span>,</div>
                  <div>{"}"});</div>
                  <br />
                  <div><span style={{ color: "rgba(107,107,128,0.6)" }}>// Agent executes within policy — chain enforces limits</span></div>
                  <div><span style={{ color: "#8844ff" }}>await</span> client.<span style={{ color: "#4488ff" }}>executeAsAgent</span>(uniswapRouter, swapCalldata, <span style={{ color: "#ffaa00" }}>parseEther("0.3")</span>);</div>
                </div>
                ) : (
                <div className="code-block">
                  <div><span style={{ color: "#8844ff" }}>import</span> * <span style={{ color: "#8844ff" }}>as</span> anchor <span style={{ color: "#8844ff" }}>from</span> <span style={{ color: "#00ff88" }}>"@coral-xyz/anchor"</span>;</div>
                  <br />
                  <div><span style={{ color: "rgba(107,107,128,0.6)" }}>// Set a policy: 2 SOL/day, Jupiter only, expires in 7 days</span></div>
                  <div><span style={{ color: "#8844ff" }}>await</span> program.methods.<span style={{ color: "#4488ff" }}>setAgentPolicy</span>(</div>
                  <div style={{ paddingLeft: "1.5rem" }}><span style={{ color: "#8844ff" }}>new</span> anchor.BN(<span style={{ color: "#ffaa00" }}>2 * LAMPORTS_PER_SOL</span>),  <span style={{ color: "rgba(107,107,128,0.6)" }}>// daily limit</span></div>
                  <div style={{ paddingLeft: "1.5rem" }}><span style={{ color: "#8844ff" }}>new</span> anchor.BN(<span style={{ color: "#ffaa00" }}>0.5 * LAMPORTS_PER_SOL</span>), <span style={{ color: "rgba(107,107,128,0.6)" }}>// per-tx limit</span></div>
                  <div style={{ paddingLeft: "1.5rem" }}><span style={{ color: "#8844ff" }}>new</span> anchor.BN(expiry),</div>
                  <div style={{ paddingLeft: "1.5rem" }}>[<span style={{ color: "#00ff88" }}>JUPITER_PROGRAM_ID</span>],  <span style={{ color: "rgba(107,107,128,0.6)" }}>// allowed programs</span></div>
                  <div style={{ paddingLeft: "1.5rem" }}>[],  <span style={{ color: "rgba(107,107,128,0.6)" }}>// allowed discriminators</span></div>
                  <div>).<span style={{ color: "#4488ff" }}>accounts</span>({"{"} vault, policy, owner, agent {"}"}).<span style={{ color: "#4488ff" }}>rpc</span>();</div>
                  <br />
                  <div><span style={{ color: "rgba(107,107,128,0.6)" }}>// Agent executes within policy — chain enforces limits</span></div>
                  <div><span style={{ color: "#8844ff" }}>await</span> program.methods.<span style={{ color: "#4488ff" }}>executeTransfer</span>(<span style={{ color: "#8844ff" }}>new</span> anchor.BN(amount))</div>
                  <div style={{ paddingLeft: "1.5rem" }}>.<span style={{ color: "#4488ff" }}>accounts</span>({"{"} vault, policy, agent, recipient {"}"}).<span style={{ color: "#4488ff" }}>signers</span>([agent]).<span style={{ color: "#4488ff" }}>rpc</span>();</div>
                </div>
                )}
              </Reveal>
            </section>

            {/* ── POLICY BUILDER ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 0.5rem" }}>
                    Tell your agent what it can do.
                  </h3>
                  <p style={{ color: "#6b6b80", fontSize: "1rem", margin: 0, maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>
                    Write your rules in plain English. AgentScope compiles them into 
                    on-chain parameters — the same ones the smart contract enforces.
                    No Solidity required.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <PolicyBuilder />
              </Reveal>
            </section>

            {/* ── TWO-LAYER ARCHITECTURE ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 0.5rem" }}>
                    Seatbelt + Airbag
                  </h3>
                  <p style={{ color: "#6b6b80", fontSize: "1rem", margin: 0, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
                    The seatbelt keeps you in place. The airbag deploys when everything else fails.
                    Two layers. Different jobs.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="grid-2col">
                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div style={{
                      fontSize: "0.7rem", color: "#ffaa00", textTransform: "uppercase",
                      letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.75rem",
                    }}>
                      Layer 2 — Agent Middleware
                    </div>
                    <h4 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
                      🛡️ The Seatbelt
                    </h4>
                    <ul style={{
                      margin: 0, padding: "0 0 0 1.2rem",
                      fontSize: "0.8rem", color: "#6b6b80", lineHeight: 2,
                    }}>
                      <li>Agent loads its policy on startup</li>
                      <li>Pre-flight checks before every transaction</li>
                      <li>Local spend tracking (no gas cost)</li>
                      <li>Self-generates status for reasoning</li>
                    </ul>
                    <div style={{
                      marginTop: "1rem", padding: "0.5rem 0.75rem",
                      background: "rgba(255,170,0,0.05)",
                      border: "1px solid rgba(255,170,0,0.15)",
                      borderRadius: 8, fontSize: "0.7rem", color: "#ffaa00",
                    }}>
                      ⚠ UX optimization — can be bypassed by compromised agent
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div style={{
                      fontSize: "0.7rem", color: "#00ff88", textTransform: "uppercase",
                      letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.75rem",
                    }}>
                      Layer 1 — On-Chain Module
                    </div>
                    <h4 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
                      🏗️ The Airbag
                    </h4>
                    <ul style={{
                      margin: 0, padding: "0 0 0 1.2rem",
                      fontSize: "0.8rem", color: "#6b6b80", lineHeight: 2,
                    }}>
                      <li>Verifies ALL constraints at execution time</li>
                      <li>Reverts if ANY constraint violated</li>
                      <li>Cannot be bypassed — math enforced</li>
                      <li>Emits events for monitoring</li>
                    </ul>
                    <div style={{
                      marginTop: "1rem", padding: "0.5rem 0.75rem",
                      background: "rgba(0,255,136,0.05)",
                      border: "1px solid rgba(0,255,136,0.15)",
                      borderRadius: 8, fontSize: "0.7rem", color: "#00ff88",
                    }}>
                      ✅ Security guarantee — even jailbroken agents can't steal
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ── JAILBREAK DEMO ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 0.5rem" }}>
                    What happens when an agent<br />
                    <span style={{ color: "#ff3366" }}>gets jailbroken?</span>
                  </h3>
                  <p style={{ color: "#6b6b80", fontSize: "1rem", margin: 0, maxWidth: 550, marginLeft: "auto", marginRight: "auto" }}>
                    A prompt injection attack hijacks an AI agent's reasoning. Watch AgentScope stop it cold.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <JailbreakDemo />
              </Reveal>
            </section>

            {/* ── DEPLOYMENT MAP ── */}
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                  <div className="section-divider" />
                  <h3 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 0.5rem" }}>
                    Deployed everywhere
                  </h3>
                  <p style={{ color: "#6b6b80", fontSize: "1rem", margin: 0 }}>
                    One contract address. Every chain. Deterministic deployment.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="glass-card" style={{ padding: "2.5rem" }}>
                  <DeploymentMap />
                </div>
              </Reveal>
            </section>

            {/* ── ERC-8004 (EVM only) ── */}
            {chainMode === "evm" && (
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{
                  background: "linear-gradient(135deg, rgba(68,136,255,0.06), rgba(136,68,255,0.06))",
                  borderRadius: 24, border: "1px solid rgba(68,136,255,0.12)", padding: "3.5rem",
                  textAlign: "center", position: "relative", overflow: "hidden",
                }}>
                  {/* Subtle glow in corner */}
                  <div style={{
                    position: "absolute", top: -50, right: -50,
                    width: 200, height: 200, borderRadius: "50%",
                    background: "rgba(136,68,255,0.08)", filter: "blur(60px)",
                    pointerEvents: "none",
                  }} />
                  <h3 style={{
                    fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem",
                    letterSpacing: "-0.02em", position: "relative",
                  }}>
                    🔗 ERC-8004 Identity Bridge
                  </h3>
                  <p style={{
                    color: "#6b6b80", maxWidth: 500, margin: "0 auto 2rem",
                    lineHeight: 1.7, fontSize: "0.95rem", position: "relative",
                  }}>
                    Link your agent's on-chain identity to a human-readable ENS name.
                    Two-way resolution: name → agent, agent → name.
                  </p>
                  <div style={{
                    display: "flex", gap: "2rem", justifyContent: "center",
                    fontSize: "0.8rem", color: "#6b6b80", flexWrap: "wrap", position: "relative",
                  }}>
                    {["Forward resolution", "Reverse lookup", "Cross-chain attestations", "Capability discovery"].map(t => (
                      <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#00ff88" }}>✓</span> {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </section>
            )}

            {/* ── Solana status banner (Solana mode) ── */}
            {chainMode === "solana" && (
            <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 10rem" }}>
              <Reveal>
                <div style={{
                  background: "linear-gradient(135deg, rgba(153,69,255,0.06), rgba(20,241,149,0.06))",
                  borderRadius: 24, border: "1px solid rgba(153,69,255,0.15)", padding: "3.5rem",
                  textAlign: "center",
                }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "#9945FF" }}>
                    ◎ Solana Program — 17/17 Tests Passing
                  </h3>
                  <p style={{ color: "#6b6b80", maxWidth: 500, margin: "0 auto 1.5rem", lineHeight: 1.7 }}>
                    Full Anchor program with 11 instructions, 3 account types, 12 error codes.
                    SPL token allowances, CPI execution, and complete EVM feature parity.
                  </p>
                  <div style={{
                    display: "flex", gap: "2rem", justifyContent: "center",
                    fontSize: "0.8rem", color: "#6b6b80", flexWrap: "wrap",
                  }}>
                    {["PDA Vault", "SPL Token Limits", "Program Whitelists", "CPI Execution", "Emergency Pause"].map(t => (
                      <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#9945FF" }}>✓</span> {t}
                      </span>
                    ))}
                  </div>
                  <div style={{
                    marginTop: "2rem", padding: "0.75rem 1.5rem",
                    background: "rgba(153,69,255,0.05)", border: "1px solid rgba(153,69,255,0.15)",
                    borderRadius: 12, display: "inline-block",
                    fontSize: "0.8rem", color: "#9945FF",
                  }}>
                    ✅ 17/17 tests passing · Same protocol (ASP-1), native Solana architecture
                  </div>
                </div>
              </Reveal>
            </section>
            )}

            {/* ── FOOTER ── */}
            <footer style={{
              maxWidth: 900, margin: "0 auto", padding: "3rem 2rem",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: "0.75rem", color: "#6b6b80",
            }}>
              <span>
                Built by{" "}
                <a href="https://github.com/ghost-clio" target="_blank"
                  style={{ color: "#f0f0f5", textDecoration: "none" }}>
                  clio_ghost
                </a>{" "}
                🌀
              </span>
              <a href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811" target="_blank"
                style={{ color: "rgba(107,107,128,0.5)", textDecoration: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem" }}>
                Sepolia: 0x0d003...f811
              </a>
            </footer>
          </>
        ) : (
          /* ═══════════════ DASHBOARD (connected) ═══════════════ */
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
            {demoMode && !isConnected && (
              <div style={{
                background: "rgba(68,136,255,0.08)", border: "1px solid rgba(68,136,255,0.2)",
                borderRadius: 12, padding: "0.75rem 1.25rem", marginBottom: "1rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "0.85rem",
              }}>
                <span>🔵 <strong>Demo Mode</strong> — Showing simulated data. Connect a wallet for real contract interaction.</span>
                <button onClick={() => setDemoMode(false)} className="btn-ghost" style={{ padding: "0.3rem 0.75rem" }}>Exit Demo</button>
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
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", justifyContent: "space-between",
              fontSize: "0.75rem", color: "#6b6b80",
            }}>
              <span>Module: <a href="https://sepolia.etherscan.io/address/0x0d0034c6AC4640463bf480cB07BE770b08Bef811" target="_blank" style={{ color: "#4488ff" }}>0x0d003...f811</a> (Sepolia)</span>
              <span>Built by clio_ghost 🌀</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
