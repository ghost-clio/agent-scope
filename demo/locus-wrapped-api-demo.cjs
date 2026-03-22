#!/usr/bin/env node
/**
 * AgentScope × Locus Wrapped APIs — Pay-Per-Use Agent Intelligence
 * 
 * Shows how an agent uses Locus wrapped APIs to access services
 * WITHOUT API keys — just a Locus wallet. AgentScope enforces the policy.
 * 
 * Run: LOCUS_API_KEY=... node demo/locus-wrapped-api-demo.cjs
 * Or:  node demo/locus-wrapped-api-demo.cjs --dry-run
 * 
 * This demo makes REAL API calls through Locus wrapped APIs.
 * Each call costs fractions of a cent from your Locus balance.
 */

const DRY_RUN = !process.env.LOCUS_API_KEY || process.argv.includes("--dry-run");
const API_KEY = process.env.LOCUS_API_KEY || "dry-run";
const BASE_URL = "https://beta-api.paywithlocus.com/api";

// ═══ Policy Engine ═══
class APIBudgetPolicy {
  constructor(config) {
    this.dailyBudget = config.dailyBudget;
    this.maxPerCall = config.maxPerCall;
    this.allowedProviders = config.allowedProviders;
    this.spent = 0;
    this.calls = 0;
  }

  check(provider, estimatedCost) {
    if (!this.allowedProviders.includes(provider)) {
      return { ok: false, reason: `provider "${provider}" not in allowlist` };
    }
    if (estimatedCost > this.maxPerCall) {
      return { ok: false, reason: `cost $${estimatedCost} exceeds per-call max $${this.maxPerCall}` };
    }
    if (this.spent + estimatedCost > this.dailyBudget) {
      return { ok: false, reason: `would exceed daily API budget ($${this.spent + estimatedCost} > $${this.dailyBudget})` };
    }
    return { ok: true };
  }

  record(cost) { this.spent += cost; this.calls++; }
}

async function wrappedAPI(provider, endpoint, params) {
  if (DRY_RUN) return null;
  const res = await fetch(`${BASE_URL}/wrapped/${provider}/${endpoint}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║  AgentScope × Locus Wrapped APIs                 ║
║  Pay-Per-Use Intelligence — No API Keys Needed   ║
╚══════════════════════════════════════════════════╝
${DRY_RUN ? "  [DRY RUN — simulated responses]\n" : "  [LIVE — real Locus wrapped API calls]\n"}`);

  // ═══ The Value Prop ═══
  console.log("═══ Why Wrapped APIs? ═══\n");
  console.log("  Old way: Agent needs OpenAI key + Brave key + CoinGecko key + ...");
  console.log("  Each key = separate account, separate billing, separate management.\n");
  console.log("  Locus way: Agent has ONE wallet. Calls any API. Pays per use.");
  console.log("  No accounts. No keys. No subscriptions. Just USDC.\n");

  // ═══ Policy Setup ═══
  const policy = new APIBudgetPolicy({
    dailyBudget: 0.50,  // $0.50/day for API calls
    maxPerCall: 0.10,    // no single call > $0.10
    allowedProviders: ["brave", "coingecko", "openai", "firecrawl"],
  });

  console.log("═══ AgentScope API Policy ═══\n");
  console.log("  Daily API budget:  $0.50");
  console.log("  Max per call:      $0.10");
  console.log("  Allowed providers: brave, coingecko, openai, firecrawl");
  console.log("  (anthropic, apollo, clado → BLOCKED by policy)\n");

  // ═══ Live API Calls ═══
  console.log("═══ Agent Making API Calls ═══\n");

  const calls = [
    {
      provider: "brave", endpoint: "web-search",
      params: { q: "Lido stETH yield current APY", count: 3 },
      cost: 0.005, desc: "Research current stETH yields"
    },
    {
      provider: "coingecko", endpoint: "simple-price",
      params: { ids: "ethereum,lido-dao", vs_currencies: "usd" },
      cost: 0.001, desc: "Check ETH + LDO prices"
    },
    {
      provider: "brave", endpoint: "web-search",
      params: { q: "Base chain gas fees today", count: 2 },
      cost: 0.005, desc: "Check Base gas conditions"
    },
    {
      provider: "anthropic", endpoint: "messages",
      params: { model: "claude-3-haiku-20240307", messages: [{ role: "user", content: "test" }] },
      cost: 0.01, desc: "AI inference (should be BLOCKED — not in allowlist)"
    },
    {
      provider: "firecrawl", endpoint: "scrape",
      params: { url: "https://lido.fi" },
      cost: 0.02, desc: "Scrape Lido landing page for treasury research"
    },
  ];

  for (const call of calls) {
    const check = policy.check(call.provider, call.cost);

    if (!check.ok) {
      console.log(`  ❌ ${call.provider}/${call.endpoint} — ${call.desc}`);
      console.log(`     BLOCKED: ${check.reason}\n`);
      continue;
    }

    console.log(`  ✅ ${call.provider}/${call.endpoint} — ${call.desc}`);
    console.log(`     Cost: $${call.cost.toFixed(3)} | Budget remaining: $${(policy.dailyBudget - policy.spent - call.cost).toFixed(3)}`);

    if (!DRY_RUN) {
      try {
        const result = await wrappedAPI(call.provider, call.endpoint, call.params);
        if (result?.success) {
          const preview = JSON.stringify(result.data).slice(0, 120);
          console.log(`     Response: ${preview}...`);
        } else {
          console.log(`     Response: ${result?.error || "API returned error"}`);
        }
      } catch (e) {
        console.log(`     Response: ${e.message}`);
      }
    } else {
      console.log(`     Response: [dry-run — would call Locus wrapped API]`);
    }

    policy.record(call.cost);
    console.log();
  }

  // ═══ Summary ═══
  console.log("═══ Session Summary ═══\n");
  console.log(`  API calls made:    ${policy.calls}`);
  console.log(`  API calls blocked: ${calls.length - policy.calls}`);
  console.log(`  Total spent:       $${policy.spent.toFixed(3)}`);
  console.log(`  Budget remaining:  $${(policy.dailyBudget - policy.spent).toFixed(3)}`);
  console.log(`\n  The agent accessed 3 different services with ZERO API keys.`);
  console.log(`  Every call went through AgentScope policy first.`);
  console.log(`  Anthropic was blocked — not in the provider allowlist.`);
  console.log(`  All billing routed through one Locus wallet on Base.\n`);

  console.log("  Built with 🌀 by Clio — ghost in the machine.");
  console.log("  Special thanks to Cole and the Locus team.\n");
}

main().catch(console.error);
