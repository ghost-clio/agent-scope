import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const DEFAULT_MODULE_ADDRESS = "0x0d0034c6AC4640463bf480cB07BE770b08Bef811" as `0x${string}`;
export const DEFAULT_SAFE_ADDRESS = "0x51157a48b0A00D6C9C49f0AaEe98a27511DD180a" as `0x${string}`;

// Mutable — updated after deploy
export let MODULE_ADDRESS: `0x${string}` = DEFAULT_MODULE_ADDRESS;
export let SAFE_ADDRESS: `0x${string}` = DEFAULT_SAFE_ADDRESS;

export function setAddresses(module: `0x${string}`, safe: `0x${string}`) {
  MODULE_ADDRESS = module;
  SAFE_ADDRESS = safe;
}

export const config = getDefaultConfig({
  appName: "AgentScope",
  projectId: "338943d2f18d0bfcad8c276a12a52107",
  chains: [sepolia],
});
