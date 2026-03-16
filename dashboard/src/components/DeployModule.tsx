import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import mockSafeArtifact from "../abi-mocksafe.json";
import moduleArtifact from "../abi-module-deploy.json";

interface DeployResult {
  safeAddress: `0x${string}`;
  moduleAddress: `0x${string}`;
  safeTxHash: string;
  moduleTxHash: string;
}

export function DeployModule({ onDeploy }: { onDeploy: (result: DeployResult) => void }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [phase, setPhase] = useState<"intro" | "deploying" | "done">("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<DeployResult | null>(null);

  const steps = [
    { label: "Creating your agent's wallet", desc: "A multi-sig wallet that holds your agent's funds" },
    { label: "Installing the permission module", desc: "AgentScope — the on-chain rules engine" },
    { label: "Funding with test ETH", desc: "Adding 0.002 Sepolia ETH so your agent can transact" },
  ];

  const handleDeploy = async () => {
    if (!walletClient || !publicClient || !address) return;
    setPhase("deploying");
    setCurrentStep(0);
    setError("");

    try {
      // Step 1: Deploy MockSafe
      const safeHash = await walletClient.deployContract({
        abi: mockSafeArtifact.abi,
        bytecode: mockSafeArtifact.bytecode as `0x${string}`,
      });
      const safeReceipt = await publicClient.waitForTransactionReceipt({ hash: safeHash });
      const safeAddress = safeReceipt.contractAddress!;
      setCurrentStep(1);

      // Step 2: Deploy AgentScopeModule(safe)
      const moduleHash = await walletClient.deployContract({
        abi: moduleArtifact.abi,
        bytecode: moduleArtifact.bytecode as `0x${string}`,
        args: [safeAddress],
      });
      const moduleReceipt = await publicClient.waitForTransactionReceipt({ hash: moduleHash });
      const moduleAddress = moduleReceipt.contractAddress!;
      setCurrentStep(2);

      // Step 3: Fund the Safe
      const fundHash = await walletClient.sendTransaction({
        to: safeAddress,
        value: parseEther("0.002"),
      });
      await publicClient.waitForTransactionReceipt({ hash: fundHash });
      setCurrentStep(3);

      const deployResult: DeployResult = {
        safeAddress,
        moduleAddress,
        safeTxHash: safeHash,
        moduleTxHash: moduleHash,
      };

      setResult(deployResult);
      setPhase("done");
      onDeploy(deployResult);
    } catch (e: any) {
      setError(e.shortMessage || e.message || "Deploy failed");
      setPhase("intro");
    }
  };

  if (phase === "done" && result) {
    return (
      <div className="card" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
            You're all set!
          </h2>
          <p style={{ color: "#6b6b80", fontSize: "0.85rem", margin: "0 0 1.5rem" }}>
            Your agent's wallet and permission system are live on Sepolia.
          </p>
        </div>
        <div style={{
          display: "grid", gap: "0.75rem", fontSize: "0.8rem",
          padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b6b80" }}>Agent Wallet</span>
            <a href={`https://sepolia.etherscan.io/address/${result.safeAddress}`} target="_blank"
              className="font-mono" style={{ color: "#4488ff", textDecoration: "none", fontSize: "0.75rem" }}>
              {result.safeAddress.slice(0, 10)}...{result.safeAddress.slice(-6)} ↗
            </a>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b6b80" }}>Permission Module</span>
            <a href={`https://sepolia.etherscan.io/address/${result.moduleAddress}`} target="_blank"
              className="font-mono" style={{ color: "#4488ff", textDecoration: "none", fontSize: "0.75rem" }}>
              {result.moduleAddress.slice(0, 10)}...{result.moduleAddress.slice(-6)} ↗
            </a>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b6b80" }}>Test funds</span>
            <span className="font-mono" style={{ fontSize: "0.75rem" }}>0.002 ETH</span>
          </div>
        </div>
        <p style={{ color: "#6b6b80", fontSize: "0.75rem", margin: "1rem 0 0", textAlign: "center" }}>
          👇 Now set your first policy below — tell your agent what it can spend.
        </p>
      </div>
    );
  }

  if (phase === "deploying") {
    return (
      <div className="card" style={{ borderColor: "rgba(68,136,255,0.2)" }}>
        <div style={{ textAlign: "center", padding: "1rem 0 0.5rem" }}>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 600 }}>
            Setting up your agent's permissions...
          </h2>
          <p style={{ color: "#6b6b80", fontSize: "0.8rem", margin: "0 0 1.5rem" }}>
            Approve each transaction in MetaMask when prompted.
          </p>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: 10,
              background: i === currentStep ? "rgba(68,136,255,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${i < currentStep ? "rgba(0,255,136,0.15)" : i === currentStep ? "rgba(68,136,255,0.15)" : "rgba(255,255,255,0.04)"}`,
              transition: "all 0.3s ease",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "0.75rem",
                fontWeight: 700, flexShrink: 0,
                background: i < currentStep ? "rgba(0,255,136,0.15)" : i === currentStep ? "rgba(68,136,255,0.15)" : "rgba(255,255,255,0.05)",
                color: i < currentStep ? "#00ff88" : i === currentStep ? "#4488ff" : "#6b6b80",
              }}>
                {i < currentStep ? "✓" : i === currentStep ? (
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                ) : (i + 1)}
              </div>
              <div>
                <div style={{
                  fontSize: "0.85rem", fontWeight: 600,
                  color: i <= currentStep ? "#f0f0f5" : "#6b6b80",
                }}>{s.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#6b6b80" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        {error && (
          <div style={{
            marginTop: "0.75rem", padding: "0.75rem",
            background: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.2)",
            borderRadius: 8, fontSize: "0.8rem", color: "#ff3366",
          }}>
            ✗ {error}
          </div>
        )}
      </div>
    );
  }

  // Intro phase — explain what's happening before any transactions
  return (
    <div className="card" style={{ borderColor: "rgba(68,136,255,0.15)" }}>
      <div style={{ textAlign: "center", padding: "1.5rem 1rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏗️</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
          Set up your agent's permission system
        </h2>
        <p style={{ color: "#6b6b80", fontSize: "0.85rem", margin: "0 0 1.5rem", lineHeight: 1.7, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          This creates a <strong style={{ color: "#f0f0f5" }}>smart wallet</strong> for your AI agent and installs 
          AgentScope — the on-chain module that enforces spending limits, contract whitelists, and session expiry.
        </p>
      </div>

      <div style={{
        display: "grid", gap: "0.5rem", marginBottom: "1.5rem",
        padding: "0 0.5rem",
      }}>
        {[
          { num: "1", text: "Create an agent wallet", sub: "A multi-sig wallet on Sepolia testnet" },
          { num: "2", text: "Install permission module", sub: "AgentScope — your on-chain rules engine" },
          { num: "3", text: "Fund with test ETH", sub: "0.002 Sepolia ETH (free testnet tokens)" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.6rem 0.75rem", borderRadius: 8,
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(68,136,255,0.1)", color: "#4488ff",
              fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
            }}>{s.num}</div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{s.text}</div>
              <div style={{ fontSize: "0.65rem", color: "#6b6b80" }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={handleDeploy}
        disabled={!walletClient}
        style={{ width: "100%", padding: "0.75rem", fontSize: "0.9rem" }}
      >
        Get Started →
      </button>

      <p style={{
        textAlign: "center", fontSize: "0.65rem", color: "#6b6b80",
        margin: "0.75rem 0 0",
      }}>
        This uses Sepolia testnet — no real funds needed. You'll approve 3 transactions in MetaMask.
      </p>

      {error && (
        <div style={{
          marginTop: "0.75rem", padding: "0.75rem",
          background: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.2)",
          borderRadius: 8, fontSize: "0.8rem", color: "#ff3366",
        }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
