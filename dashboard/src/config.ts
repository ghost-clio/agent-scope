import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const MODULE_ADDRESS = "0x0d0034c6AC4640463bf480cB07BE770b08Bef811" as const;
export const SAFE_ADDRESS = "0x51157a48b0A00D6C9C49f0AaEe98a27511DD180a" as const;

export const config = getDefaultConfig({
  appName: "AgentScope",
  projectId: "agentscope-dashboard",
  chains: [sepolia],
});
