import { useState, useEffect } from "react";

export function LocusWallet() {
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "connected" | "demo">("loading");

  useEffect(() => {
    // In production, this would call the Locus API
    // For the dashboard demo, show the integration point
    const timer = setTimeout(() => {
      setBalance("4.97");
      setStatus("demo");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const dailyBudget = 3.15;
  const daysRemaining = balance ? (parseFloat(balance) / dailyBudget).toFixed(1) : "—";

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#6b6b80" }}>
          💰 Locus Operating Budget
        </h3>
        <span style={{
          fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: 6,
          background: "rgba(0,200,83,0.1)", color: "#00c853", fontWeight: 500,
        }}>
          Base • USDC
        </span>
      </div>

      {status === "loading" ? (
        <div style={{ color: "#6b6b80", fontSize: "0.8rem" }}>Connecting to Locus...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{
              padding: "0.75rem", borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
            }}>
              <div style={{ fontSize: "0.65rem", color: "#6b6b80", marginBottom: "0.25rem" }}>Balance</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#00c853" }}>
                ${balance}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#6b6b80" }}>USDC on Base</div>
            </div>
            <div style={{
              padding: "0.75rem", borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
            }}>
              <div style={{ fontSize: "0.65rem", color: "#6b6b80", marginBottom: "0.25rem" }}>Runway</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "rgba(240,240,245,0.9)" }}>
                {daysRemaining}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#6b6b80" }}>days at ${dailyBudget}/day</div>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
            fontSize: "0.7rem", color: "rgba(240,240,245,0.6)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.35rem 0.5rem", borderRadius: 6,
              background: "rgba(255,255,255,0.02)",
            }}>
              <span>📊</span> Daily limit: ${dailyBudget}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.35rem 0.5rem", borderRadius: 6,
              background: "rgba(255,255,255,0.02)",
            }}>
              <span>🔒</span> Per-tx max: $1.00
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.35rem 0.5rem", borderRadius: 6,
              background: "rgba(255,255,255,0.02)",
            }}>
              <span>🏷️</span> compute, api, inference
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.35rem 0.5rem", borderRadius: 6,
              background: "rgba(255,255,255,0.02)",
            }}>
              <span>📝</span> Memo required
            </div>
          </div>

          <div style={{
            marginTop: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: 8,
            background: "rgba(68,136,255,0.06)", border: "1px solid rgba(68,136,255,0.15)",
            fontSize: "0.7rem", color: "rgba(240,240,245,0.7)",
          }}>
            Powered by <a href="https://paywithlocus.com" target="_blank" rel="noopener" style={{ color: "#4488ff", textDecoration: "none" }}>Locus</a> — 
            agent pays for compute, APIs, and services from this wallet. 
            Fund via <a href="https://paywithlocus.com" target="_blank" rel="noopener" style={{ color: "#4488ff", textDecoration: "none" }}>Checkout</a> or direct USDC transfer.
          </div>
        </>
      )}
    </div>
  );
}
