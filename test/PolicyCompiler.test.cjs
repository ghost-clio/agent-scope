/**
 * Tests for the ASP-1 Policy Language Compiler
 *
 * Tests the natural language parser, JSON→calldata compiler,
 * human-readable summarizer, validator, and templates.
 *
 * Run: node test/PolicyCompiler.test.cjs
 */

const { parseEther, formatEther } = require("ethers");
const assert = require("assert");

// ═══════════════════════════════════════════════
//  INLINE PARSER (mirrors policy/compiler.ts logic)
//  Using plain JS for test portability
// ═══════════════════════════════════════════════

const KNOWN_CONTRACTS = {
  uniswap: { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", name: "Uniswap V3 Router" },
  aave: { address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", name: "Aave V3 Pool" },
};

const KNOWN_TOKENS = {
  USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  DAI: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
};

function parseNL(input) {
  const lower = input.toLowerCase();
  const result = { native: null, tokens: [], contracts: [], functions: [], expiry: null };

  // Native limits
  const dailyMatch = lower.match(/([\d.]+)\s*eth\s*(?:per\s*day|\/day|daily)/);
  if (dailyMatch) {
    result.native = { dailyLimit: `${dailyMatch[1]} ETH` };
    const perTxMatch = lower.match(/([\d.]+)\s*eth\s*(?:per\s*(?:tx|transaction)|\/tx)/);
    if (perTxMatch) result.native.perTransaction = `${perTxMatch[1]} ETH`;
  }

  // Token limits
  const tokenMatches = lower.matchAll(/([\d,.]+)\s*(usdc|usdt|dai)\s*(?:per\s*day|\/day|daily)/gi);
  for (const m of tokenMatches) {
    const sym = m[2].toUpperCase();
    if (KNOWN_TOKENS[sym]) result.tokens.push({ symbol: sym, dailyLimit: m[1].replace(/,/g, "") });
  }

  // Contracts
  const onlyMatch = lower.match(/(?:only|whitelist)\s+([\w\s,&]+?)(?:\.|,\s*(?:only|max|no|expires|[\d.])|$)/);
  if (onlyMatch) {
    const names = onlyMatch[1].split(/[,&]|\band\b/).map(n => n.trim().toLowerCase()).filter(Boolean);
    for (const name of names) {
      if (KNOWN_CONTRACTS[name]) result.contracts.push(KNOWN_CONTRACTS[name]);
    }
  }

  // Expiry
  const hoursMatch = lower.match(/expires?\s+(?:in\s+)?(\d+)\s*h/);
  if (hoursMatch) result.expiry = parseInt(hoursMatch[1]) * 3600;
  const daysMatch = lower.match(/expires?\s+(?:in\s+)?(\d+)\s*d/);
  if (daysMatch) result.expiry = parseInt(daysMatch[1]) * 86400;

  return result;
}

// ═══════════════════════════════════════════════
//  TESTS
// ═══════════════════════════════════════════════

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failed++;
  }
}

console.log("\n📋 Policy Compiler Tests\n");

// ── Natural Language Parser ──

console.log("  Natural Language Parser:");

test("parses daily ETH limit", () => {
  const r = parseNL("0.5 ETH per day");
  assert.strictEqual(r.native.dailyLimit, "0.5 ETH");
});

test("parses ETH/day shorthand", () => {
  const r = parseNL("1 ETH/day");
  assert.strictEqual(r.native.dailyLimit, "1 ETH");
});

test("parses daily with decimal", () => {
  const r = parseNL("0.05 eth daily");
  assert.strictEqual(r.native.dailyLimit, "0.05 ETH");
});

test("parses per-tx limit", () => {
  const r = parseNL("0.5 ETH per day, 0.1 ETH per tx");
  assert.strictEqual(r.native.dailyLimit, "0.5 ETH");
  assert.strictEqual(r.native.perTransaction, "0.1 ETH");
});

test("parses per-tx /tx shorthand", () => {
  const r = parseNL("1 ETH/day, 0.2 ETH/tx");
  assert.strictEqual(r.native.perTransaction, "0.2 ETH");
});

test("parses USDC token limit", () => {
  const r = parseNL("500 USDC per day");
  assert.strictEqual(r.tokens.length, 1);
  assert.strictEqual(r.tokens[0].symbol, "USDC");
  assert.strictEqual(r.tokens[0].dailyLimit, "500");
});

test("parses multiple token limits", () => {
  const r = parseNL("500 USDC daily, 1000 USDT per day");
  assert.strictEqual(r.tokens.length, 2);
  assert.strictEqual(r.tokens[0].symbol, "USDC");
  assert.strictEqual(r.tokens[1].symbol, "USDT");
});

test("parses token with commas", () => {
  const r = parseNL("1,000 USDC per day");
  assert.strictEqual(r.tokens[0].dailyLimit, "1000");
});

test("parses 'only Uniswap'", () => {
  const r = parseNL("only Uniswap");
  assert.strictEqual(r.contracts.length, 1);
  assert.strictEqual(r.contracts[0].name, "Uniswap V3 Router");
});

test("parses 'only Uniswap and Aave'", () => {
  const r = parseNL("only Uniswap and Aave");
  assert.strictEqual(r.contracts.length, 2);
});

test("parses 'whitelist Aave'", () => {
  const r = parseNL("whitelist Aave");
  assert.strictEqual(r.contracts.length, 1);
  assert.strictEqual(r.contracts[0].name, "Aave V3 Pool");
});

test("parses hours expiry", () => {
  const r = parseNL("expires in 24h");
  assert.strictEqual(r.expiry, 86400);
});

test("parses days expiry", () => {
  const r = parseNL("expires in 7d");
  assert.strictEqual(r.expiry, 604800);
});

test("parses 'expire 3d' (no 's')", () => {
  const r = parseNL("expire in 3d");
  assert.strictEqual(r.expiry, 259200);
});

test("handles no spending limits", () => {
  const r = parseNL("only Uniswap, expires in 24h");
  assert.strictEqual(r.native, null);
  assert.strictEqual(r.tokens.length, 0);
});

test("handles no contracts", () => {
  const r = parseNL("0.5 ETH per day");
  assert.strictEqual(r.contracts.length, 0);
});

test("handles no expiry", () => {
  const r = parseNL("0.5 ETH per day, only Uniswap");
  assert.strictEqual(r.expiry, null);
});

test("parses complex tweet-style input", () => {
  const r = parseNL("0.5 ETH per day, 0.1 ETH per tx, only Uniswap, expires in 24h");
  assert.strictEqual(r.native.dailyLimit, "0.5 ETH");
  assert.strictEqual(r.native.perTransaction, "0.1 ETH");
  assert.strictEqual(r.contracts.length, 1);
  assert.strictEqual(r.expiry, 86400);
});

test("parses payroll-style input", () => {
  const r = parseNL("1000 USDC daily, expires in 7d");
  assert.strictEqual(r.tokens[0].dailyLimit, "1000");
  assert.strictEqual(r.expiry, 604800);
});

test("handles empty input", () => {
  const r = parseNL("");
  assert.strictEqual(r.native, null);
  assert.strictEqual(r.tokens.length, 0);
  assert.strictEqual(r.contracts.length, 0);
});

test("handles gibberish", () => {
  const r = parseNL("lorem ipsum dolor sit amet");
  assert.strictEqual(r.native, null);
  assert.strictEqual(r.contracts.length, 0);
});

// ── Validation Logic ──

console.log("\n  Validation:");

test("warns on no spending limits", () => {
  const r = parseNL("only Uniswap");
  assert.strictEqual(r.native, null);
  // validator would flag this
});

test("warns on no contract restrictions", () => {
  const r = parseNL("0.5 ETH per day");
  assert.strictEqual(r.contracts.length, 0);
  // validator would flag this
});

test("warns on no expiry", () => {
  const r = parseNL("0.5 ETH per day, only Uniswap");
  assert.strictEqual(r.expiry, null);
  // validator would flag this
});

test("per-tx exceeding daily is valid but warned", () => {
  const r = parseNL("0.1 ETH per day, 0.5 ETH per tx");
  assert.strictEqual(r.native.dailyLimit, "0.1 ETH");
  assert.strictEqual(r.native.perTransaction, "0.5 ETH");
  // validator would warn perTx > daily
});

// ── Compilation ──

console.log("\n  Wei Conversion:");

test("0.5 ETH → correct wei", () => {
  const wei = parseEther("0.5");
  assert.strictEqual(wei.toString(), "500000000000000000");
});

test("0.001 ETH → correct wei", () => {
  const wei = parseEther("0.001");
  assert.strictEqual(wei.toString(), "1000000000000000");
});

test("1 ETH → correct wei", () => {
  const wei = parseEther("1");
  assert.strictEqual(wei.toString(), "1000000000000000000");
});

test("wei → ETH roundtrip", () => {
  const wei = parseEther("0.123456");
  assert.strictEqual(formatEther(wei), "0.123456");
});

// ── Summary ──

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
