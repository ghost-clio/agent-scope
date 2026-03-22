import { useWatchContractEvent } from "wagmi";
import { useState } from "react";
import abi from "../abi.json";
import { MODULE_ADDRESS } from "../config";

interface Event {
  type: "execution" | "violation" | "policy" | "revoke" | "pause";
  agent: string;
  detail: string;
  timestamp: number;
}

export function EventFeed() {
  const [events, setEvents] = useState<Event[]>([]);

  const addEvent = (event: Event) => {
    setEvents((prev) => [event, ...prev].slice(0, 50));
  };

  useWatchContractEvent({
    address: MODULE_ADDRESS,
    abi,
    eventName: "AgentExecuted",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        addEvent({
          type: "execution",
          agent: args?.agent || "unknown",
          detail: `→ ${(args?.to || "").slice(0, 8)}... | ${args?.value ? (Number(args.value) / 1e18).toFixed(4) : "0"} ETH`,
          timestamp: Date.now(),
        });
      }
    },
  });

  useWatchContractEvent({
    address: MODULE_ADDRESS,
    abi,
    eventName: "PolicyViolation",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        addEvent({
          type: "violation",
          agent: args?.agent || "unknown",
          detail: args?.reason || "unknown violation",
          timestamp: Date.now(),
        });
      }
    },
  });

  useWatchContractEvent({
    address: MODULE_ADDRESS,
    abi,
    eventName: "AgentRevoked",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        addEvent({
          type: "revoke",
          agent: args?.agent || "unknown",
          detail: "Agent revoked",
          timestamp: Date.now(),
        });
      }
    },
  });

  useWatchContractEvent({
    address: MODULE_ADDRESS,
    abi,
    eventName: "GlobalPause",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        addEvent({
          type: "pause",
          agent: "system",
          detail: args?.paused ? "🔴 MODULE PAUSED" : "🟢 MODULE UNPAUSED",
          timestamp: Date.now(),
        });
      }
    },
  });

  const typeColors: Record<string, string> = {
    execution: "var(--accent-green)",
    violation: "var(--accent-red)",
    policy: "var(--accent-blue)",
    revoke: "var(--accent-amber)",
    pause: "var(--accent-red)",
  };

  const typeLabels: Record<string, string> = {
    execution: "TX",
    violation: "⚠ BLOCKED",
    policy: "POLICY",
    revoke: "REVOKED",
    pause: "PAUSE",
  };

  return (
    <div className="card">
      <h2
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1rem",
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        Live Event Feed
      </h2>

      <div className="event-feed">
        {events.length === 0 ? (
          <div style={{ padding: "1rem 0", fontSize: "0.8rem" }}>
            <div style={{
              textAlign: "center", padding: "1rem 0 1.5rem",
              color: "var(--text-secondary)",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📡</div>
              Listening for on-chain events...
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.7rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                Recent activity (demo)
              </div>
              {[
                { type: "TX", color: "var(--accent-green)", agent: "0xA1b2...c3D4", detail: "→ Uniswap V3 | 0.45 ETH swap", time: "2m ago" },
                { type: "⚠ BLOCKED", color: "var(--accent-red)", agent: "0xE5f6...g7H8", detail: "DAILY_LIMIT_EXCEEDED", time: "5m ago" },
                { type: "TX", color: "var(--accent-green)", agent: "0xA1b2...c3D4", detail: "→ Locus | $0.50 USDC (inference)", time: "12m ago" },
                { type: "POLICY", color: "var(--accent-blue)", agent: "owner", detail: "dailyLimit updated: 2→5 ETH", time: "1h ago" },
              ].map((e, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.35rem 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                  opacity: 0.5,
                }}>
                  <span style={{ color: e.color, fontWeight: 700, fontSize: "0.6rem", minWidth: 65, fontFamily: "monospace" }}>{e.type}</span>
                  <span className="font-mono" style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}>{e.agent}</span>
                  <span style={{ flex: 1, fontSize: "0.7rem", color: "rgba(240,240,245,0.7)" }}>{e.detail}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.6rem" }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.5rem 0",
                borderBottom:
                  i < events.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                fontSize: "0.85rem",
              }}
            >
              <span
                style={{
                  color: typeColors[event.type],
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  minWidth: "70px",
                  fontFamily: "monospace",
                }}
              >
                {typeLabels[event.type]}
              </span>
              <div style={{ flex: 1 }}>
                <span
                  className="font-mono"
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                  }}
                >
                  {event.agent.slice(0, 6)}...{event.agent.slice(-4)}
                </span>
                <div>{event.detail}</div>
              </div>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                }}
              >
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
