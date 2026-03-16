import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEther, formatEther } from "viem";
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
  const [deploying, setDeploying] = useState(false);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<DeployResult | null>(null);

  const handleDeploy = async () => {
    if (!walletClient || !publicClient || !address) return;
    setDeploying(true);
    setError("");

    try {
      // Step 1: Deploy MockSafe
      setStep("Deploying Safe...");
      const safeHash = await walletClient.deployContract({
        abi: mockSafeArtifact.abi,
        bytecode: mockSafeArtifact.bytecode as `0x${string}`,
      });
      const safeReceipt = await publicClient.waitForTransactionReceipt({ hash: safeHash });
      const safeAddress = safeReceipt.contractAddress!;

      // Step 2: Deploy AgentScopeModule(safe)
      setStep("Deploying AgentScope Module...");
      const moduleHash = await walletClient.deployContract({
        abi: moduleArtifact.abi,
        bytecode: moduleArtifact.bytecode as `0x${string}`,
        args: [safeAddress],
      });
      const moduleReceipt = await publicClient.waitForTransactionReceipt({ hash: moduleHash });
      const moduleAddress = moduleReceipt.contractAddress!;

      // Step 3: Fund the Safe with a small amount
      setStep("Funding Safe...");
      const fundHash = await walletClient.sendTransaction({
        to: safeAddress,
        value: parseEther("0.002"),
      });
      await publicClient.waitForTransactionReceipt({ hash: fundHash });

      const deployResult: DeployResult = {
        safeAddress,
        moduleAddress,
        safeTxHash: safeHash,
        moduleTxHash: moduleHash,
      };

      setResult(deployResult);
      setStep("");
      onDeploy(deployResult);
    } catch (e: any) {
      setError(e.shortMessage || e.message || "Deploy failed");
      setStep("");
    } finally {
      setDeploying(false);
    }
  };

  if (result) {
    return (
      <div className="card" style={{ borderColor: "rgba(0,255,136,0.2)" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", color: "var(--accent-green)", fontWeight: 600 }}>
          ✅ Deployed
        </h2>
        <div style={{ fontSize: "0.8rem", lineHeight: 2 }}>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Safe: </span>
            <a href={`https://sepolia.etherscan.io/address/${result.safeAddress}`} target="_blank"
              className="font-mono" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
              {result.safeAddress.slice(0, 10)}...{result.safeAddress.slice(-6)}
            </a>
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Module: </span>
            <a href={`https://sepolia.etherscan.io/address/${result.moduleAddress}`} target="_blank"
              className="font-mono" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
              {result.moduleAddress.slice(0, 10)}...{result.moduleAddress.slice(-6)}
            </a>
          </div>
          <div style={{ color: "var(--text-secondary)" }}>Funded: 0.002 ETH</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500 }}>
        Deploy AgentScope
      </h2>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
        Deploy a Safe wallet + AgentScope Module on Sepolia. This creates your on-chain permission system.
      </p>
      <button
        className="btn-primary"
        onClick={handleDeploy}
        disabled={deploying || !walletClient}
        style={{ width: "100%", padding: "0.75rem" }}
      >
        {deploying ? step || "Deploying..." : "Deploy Safe + Module →"}
      </button>
      {error && (
        <div style={{
          marginTop: "0.75rem", padding: "0.5rem",
          background: "rgba(239,68,68,0.1)", border: "1px solid var(--accent-red)",
          borderRadius: 6, fontSize: "0.8rem", color: "var(--accent-red)",
        }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
