import { useState, useEffect } from "react";

interface DemoStep {
  title: string;
  narrative: string;
  code: string;
  event: { type: string; detail: string };
  highlight: string;
}

const STEPS: DemoStep[] = [
  {
    title: "1. Human sets policy",
    narrative: "You own a Safe with 10 ETH. You want your trading agent to operate autonomously — but within limits.",
    code: `module.setAgentPolicy(
  agent,
  0.5 ether,         // 0.5 ETH daily limit
  0.1 ether,         // max 0.1 per transaction
  block.timestamp + 24h,  // expires tomorrow
  [uniswapRouter],   // Uniswap only
  [swap.selector]    // swap() only
);`,
    event: { type: "policy", detail: "PolicySet: 0xAgent → 0.5 ETH/day, Uniswap swap() only, expires 24h" },
    highlight: "The agent can now transact — but ONLY within these bounds.",
  },
  {
    title: "2. Agent swaps 0.08 ETH ✅",
    narrative: "The agent spots an opportunity and executes a swap. The module checks: within daily limit? ✓ Within per-tx limit? ✓ Whitelisted contract? ✓ Allowed function? ✓",
    code: `module.executeAsAgent(
  uniswapRouter,
  0.08 ether,
  swapCalldata
); // ✅ Success — budget: 0.42 ETH remaining`,
    event: { type: "execution", detail: "AgentExecuted: 0xAgent → Uniswap Router | 0.08 ETH | swap()" },
    highlight: "Transaction goes through. Budget drops to 0.42 ETH.",
  },
  {
    title: "3. Agent swaps again — 0.1 ETH ✅",
    narrative: "Another trade. Still within bounds. The module tracks cumulative spend per 24h window.",
    code: `module.executeAsAgent(
  uniswapRouter,
  0.1 ether,
  swapCalldata
); // ✅ Success — budget: 0.32 ETH remaining`,
    event: { type: "execution", detail: "AgentExecuted: 0xAgent → Uniswap Router | 0.1 ETH | swap()" },
    highlight: "Cumulative spend: 0.18 ETH of 0.5 ETH daily limit.",
  },
  {
    title: "4. Agent tries 0.4 ETH — BLOCKED 🚫",
    narrative: "The agent gets greedy (or hallucinated a bad trade). 0.4 ETH would exceed the remaining 0.32 ETH budget. The contract REVERTS.",
    code: `module.executeAsAgent(
  uniswapRouter,
  0.4 ether,        // exceeds 0.32 remaining
  swapCalldata
); // 🚫 REVERTS: "DailyLimitExceeded"`,
    event: { type: "violation", detail: "PolicyViolation: 0xAgent | DailyLimitExceeded (0.4 > 0.32 remaining)" },
    highlight: "The agent literally cannot overspend. The math says no.",
  },
  {
    title: "5. Agent tries Aave — BLOCKED 🚫",
    narrative: "The agent tries a different protocol. Aave isn't on the whitelist. Doesn't matter what the agent wants — the contract only allows Uniswap.",
    code: `module.executeAsAgent(
  aavePool,          // not whitelisted
  0.05 ether,
  supplyCalldata
); // 🚫 REVERTS: "ContractNotWhitelisted"`,
    event: { type: "violation", detail: "PolicyViolation: 0xAgent | ContractNotWhitelisted (0xAave...)" },
    highlight: "Wrong contract. Blocked. The whitelist is enforced on-chain.",
  },
  {
    title: "6. Human hits the kill switch 🔴",
    narrative: "Something feels wrong. The human calls setPaused(true). One transaction. Every agent on this module freezes instantly.",
    code: `module.setPaused(true);
// ALL agent execution blocked globally
// Human can still manage policies`,
    event: { type: "pause", detail: "GlobalPause: ALL agents frozen | Emergency shutdown by Safe owner" },
    highlight: "One transaction to freeze everything. Agents can't override it.",
  },
];

export function GuidedDemo() {
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState<Array<{ type: string; detail: string; step: number }>>([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [typing, setTyping] = useState(false);
  const [displayedCode, setDisplayedCode] = useState("");

  const current = STEPS[step];

  // Type out code effect
  useEffect(() => {
    setTyping(true);
    setDisplayedCode("");
    const code = current.code;
    let i = 0;
    const interval = setInterval(() => {
      if (i < code.length) {
        setDisplayedCode(code.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTyping(false);
        // Add event after typing finishes
        setEvents(prev => [{ ...current.event, step }, ...prev].slice(0, 10));
      }
    }, 12);
    return () => clearInterval(interval);
  }, [step]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || typing) return;
    const timer = setTimeout(() => {
      if (step < STEPS.length - 1) setStep(s => s + 1);
      else { setAutoPlay(false); setStep(0); }
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoPlay, step, typing]);

  const typeColors: Record<string, string> = {
    execution: "#10b981", violation: "#ef4444", policy: "#3b82f6", pause: "#ef4444",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem" }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            onClick={() => { setStep(i); setAutoPlay(false); }}
            style={{
              flex: 1, height: 4, borderRadius: 2, cursor: "pointer",
              background: i <= step ? (i === step ? "#10b981" : "#3b82f6") : "#1a1a2e",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Step header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{current.title}</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            style={{
              background: autoPlay ? "rgba(16,185,129,0.15)" : "transparent",
              border: `1px solid ${autoPlay ? "#10b981" : "#2a2a3e"}`,
              color: autoPlay ? "#10b981" : "#a1a1aa",
              borderRadius: 6, padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.75rem",
            }}
          >
            {autoPlay ? "⏸ Pause" : "▶ Auto-play"}
          </button>
        </div>
      </div>

      {/* Narrative */}
      <p style={{ color: "#a1a1aa", lineHeight: 1.7, margin: "0 0 1.25rem", fontSize: "0.9rem" }}>
        {current.narrative}
      </p>

      {/* Code block */}
      <div style={{
        background: "#0d0d14", borderRadius: 12, border: "1px solid #1a1a2e",
        padding: "1.25rem 1.5rem", marginBottom: "1rem",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.8rem",
        lineHeight: 1.7, whiteSpace: "pre", overflowX: "auto", position: "relative",
      }}>
        <span style={{ color: "#e4e4e7" }}>{displayedCode}</span>
        {typing && <span style={{ color: "#10b981", animation: "blink 0.7s infinite" }}>▌</span>}
      </div>

      {/* Highlight callout */}
      {!typing && (
        <div style={{
          background: current.event.type === "violation" || current.event.type === "pause"
            ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
          border: `1px solid ${current.event.type === "violation" || current.event.type === "pause"
            ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
          borderRadius: 10, padding: "0.85rem 1.25rem", marginBottom: "1.5rem",
          fontSize: "0.85rem", fontWeight: 500,
          color: current.event.type === "violation" || current.event.type === "pause" ? "#ef4444" : "#10b981",
          animation: "fadeIn 0.4s ease",
        }}>
          → {current.highlight}
        </div>
      )}

      {/* Event log */}
      <div style={{
        background: "#0d0d14", borderRadius: 12, border: "1px solid #1a1a2e",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "0.6rem 1rem", borderBottom: "1px solid #1a1a2e",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "#52525b", fontFamily: "monospace" }}>
            📡 on-chain event log
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
          </div>
        </div>
        <div style={{ padding: "0.75rem 1rem", maxHeight: 180, overflowY: "auto" }}>
          {events.length === 0 ? (
            <div style={{ color: "#52525b", fontSize: "0.8rem", fontStyle: "italic" }}>Waiting for events...</div>
          ) : events.map((ev, i) => (
            <div key={`${ev.step}-${i}`} style={{
              padding: "0.3rem 0", fontSize: "0.75rem", fontFamily: "monospace",
              borderBottom: i < events.length - 1 ? "1px solid #12121a" : "none",
              animation: i === 0 ? "fadeIn 0.5s ease" : undefined,
              opacity: 0.5 + 0.5 * (1 - i / events.length),
            }}>
              <span style={{ color: typeColors[ev.type] || "#a1a1aa", fontWeight: 700, marginRight: "0.75rem" }}>
                {ev.type === "violation" ? "⚠ BLOCKED" : ev.type === "pause" ? "🔴 PAUSE" : ev.type === "policy" ? "📋 POLICY" : "✅ TX"}
              </span>
              <span style={{ color: "#e4e4e7" }}>{ev.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button
          onClick={() => { setStep(Math.max(0, step - 1)); setAutoPlay(false); }}
          disabled={step === 0}
          style={{
            background: "transparent", border: "1px solid #2a2a3e", color: step === 0 ? "#2a2a3e" : "#a1a1aa",
            borderRadius: 8, padding: "0.5rem 1.25rem", cursor: step === 0 ? "default" : "pointer", fontSize: "0.85rem",
          }}
        >
          ← Back
        </button>
        <span style={{ color: "#52525b", fontSize: "0.8rem", alignSelf: "center" }}>
          {step + 1} / {STEPS.length}
        </span>
        <button
          onClick={() => { setStep(Math.min(STEPS.length - 1, step + 1)); setAutoPlay(false); }}
          disabled={step === STEPS.length - 1}
          style={{
            background: step === STEPS.length - 1 ? "transparent" : "rgba(16,185,129,0.15)",
            border: `1px solid ${step === STEPS.length - 1 ? "#2a2a3e" : "#10b981"}`,
            color: step === STEPS.length - 1 ? "#2a2a3e" : "#10b981",
            borderRadius: 8, padding: "0.5rem 1.25rem",
            cursor: step === STEPS.length - 1 ? "default" : "pointer", fontSize: "0.85rem",
          }}
        >
          Next →
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
