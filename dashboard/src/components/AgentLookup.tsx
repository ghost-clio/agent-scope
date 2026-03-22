import { useState } from "react";
import { useReadContract, useEnsAddress } from "wagmi";
import { formatEther, isAddress } from "viem";
import { mainnet } from "wagmi/chains";
import abi from "../abi.json";


export function AgentLookup({ moduleAddress }: { moduleAddress: `0x${string}` }) {
  const [agentAddress, setAgentAddress] = useState("");
  const [query, setQuery] = useState("");

  // ENS resolution
  const isEns = agentAddress.endsWith(".eth");
  const { data: ensResolved } = useEnsAddress({
    name: isEns ? agentAddress : undefined,
    chainId: mainnet.id,
  });

  const resolvedAddress = isEns ? ensResolved : (isAddress(agentAddress) ? agentAddress as `0x${string}` : undefined);

  const { data: scope, isLoading, error } = useReadContract({
    address: moduleAddress,
    abi,
    functionName: "getAgentScope",
    args: query ? [query as `0x${string}`] : undefined,
    query: { enabled: !!query && isAddress(query) },
  });

  const handleLookup = () => {
    const addr = resolvedAddress || agentAddress;
    if (isAddress(addr)) {
      setQuery(addr as string);
    }
  };

  const s = scope as any;
  const isActive = s?.active || s?.[0];
  const dailyLimit = s?.dailySpendLimitWei || s?.[1] || 0n;
  const maxPerTx = s?.maxPerTxWei || s?.[2] || 0n;
  const expiry = s?.sessionExpiry || s?.[3] || 0n;
  const remaining = s?.remainingBudget || s?.[4] || 0n;
  const contracts = s?.allowedContracts || s?.[5] || [];
  const functions = s?.allowedFunctions || s?.[6] || [];

  const budgetPct =
    dailyLimit > 0n ? Number((remaining * 100n) / dailyLimit) : 0;
  const isExpired =
    expiry > 0n && BigInt(Math.floor(Date.now() / 1000)) > expiry;

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
        Agent Scope Lookup
      </h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="0x... or name.eth"
          value={agentAddress}
          onChange={(e) => setAgentAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          className="font-mono"
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
        <button className="btn-primary" onClick={handleLookup}>
          Lookup
        </button>
      </div>

      {isEns && ensResolved && (
        <div style={{ fontSize: "0.7rem", color: "var(--accent-green)", marginBottom: "0.5rem", fontFamily: "monospace" }}>
          ✓ {agentAddress} → {ensResolved.slice(0, 10)}...{ensResolved.slice(-6)}
        </div>
      )}

      {isLoading && (
        <p style={{ color: "var(--text-secondary)" }}>Loading scope...</p>
      )}

      {error && (
        <p style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>
          Error reading scope
        </p>
      )}

      {s && (
        <div>
          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <span
              className={`status-dot ${
                !isActive
                  ? "status-revoked"
                  : isExpired
                  ? "status-expired"
                  : "status-active"
              }`}
            />
            <span style={{ fontWeight: 600 }}>
              {!isActive ? "INACTIVE" : isExpired ? "EXPIRED" : "ACTIVE"}
            </span>
          </div>

          {isActive && (
            <>
              {/* Budget */}
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.25rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Daily Budget
                  </span>
                  <span className="font-mono">
                    {formatEther(remaining)} / {formatEther(dailyLimit)} ETH
                  </span>
                </div>
                <div className="budget-bar">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${budgetPct}%`,
                      background:
                        budgetPct > 50
                          ? "var(--accent-green)"
                          : budgetPct > 20
                          ? "var(--accent-amber)"
                          : "var(--accent-red)",
                    }}
                  />
                </div>
              </div>

              {/* Per-tx limit */}
              {maxPerTx > 0n && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Per-tx limit
                  </span>
                  <span className="font-mono">
                    {formatEther(maxPerTx)} ETH
                  </span>
                </div>
              )}

              {/* Expiry */}
              <div
                style={{
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Session Expiry
                </span>
                <span>
                  {expiry === 0n
                    ? "None (permanent)"
                    : new Date(Number(expiry) * 1000).toLocaleString()}
                </span>
              </div>

              {/* Whitelists */}
              <div
                style={{
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Contracts
                </span>
                <span>
                  {contracts.length === 0
                    ? "Any"
                    : `${contracts.length} whitelisted`}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Functions
                </span>
                <span>
                  {functions.length === 0
                    ? "Any"
                    : `${functions.length} whitelisted`}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
