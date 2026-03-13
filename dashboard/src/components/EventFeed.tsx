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
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              textAlign: "center",
              padding: "2rem 0",
            }}
          >
            Watching for agent activity...
          </p>
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
