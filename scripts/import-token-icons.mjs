#!/usr/bin/env node
/**
 * Sparse-import community token logos from a public GitHub tokens tree.
 *
 * Default source: TP-Lab/tokens (community submissions; no SPDX license).
 * Does NOT dump the whole repo — only listed chain folders, with a hard cap.
 *
 * Usage:
 *   node scripts/import-token-icons.mjs
 *   node scripts/import-token-icons.mjs --chains eth,bsc,bitcoin,tron,solana --limit 50
 *
 * Product rule: never surface third-party wallet brands in UI.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const DEFAULT_CHAINS = [
  "eth",
  "bsc",
  "bitcoin",
  "tron",
  "solana",
  "base",
  "arbitrum",
  "optimistic",
  "polygon(matic)",
  "Avalanche-C",
  "ton",
  "apt",
].join(",");

const chains = String(arg("--chains", DEFAULT_CHAINS))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const limit = Number(arg("--limit", "80"));
const apiBase = "https://api.github.com/repos/TP-Lab/tokens/contents";
const rawBase = "https://raw.githubusercontent.com/TP-Lab/tokens/master";

/** Native asset icons (MIT: trustwallet/assets) — TP tokens repo has almost no native BTC logo. */
const NATIVE_ICONS = [
  {
    id: "bitcoin",
    symbol: "BTC",
    url: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
    rel: "tokens/bitcoin/BTC.png",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    url: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    rel: "tokens/eth/ETH.png",
  },
  {
    id: "tron",
    symbol: "TRX",
    url: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png",
    rel: "tokens/tron/TRX.png",
  },
  {
    id: "solana",
    symbol: "SOL",
    url: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
    rel: "tokens/solana/SOL.png",
  },
];

async function listDir(path) {
  const enc = path
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  const url = `${apiBase}/${enc}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "cb-wallet-static-import/1.0",
    },
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "user-agent": "cb-wallet-static-import/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 32) throw new Error("too small");
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
}

function rawUrl(repoPath) {
  return `${rawBase}/${repoPath
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")}`;
}

/** Collect leaf token dirs that contain logo.png (supports bitcoin/brc20/ordi). */
async function collectTokenLeaves(chainPath, depth = 0) {
  const entries = await listDir(chainPath);
  if (!Array.isArray(entries)) return [];

  const files = new Set(entries.filter((e) => e.type === "file").map((e) => e.name));
  const dirs = entries.filter((e) => e.type === "dir");
  const out = [];

  // Root/native logo is a leaf, but must NOT stop recursion into token folders.
  if (files.has("logo.png")) {
    out.push(chainPath);
  }

  if (dirs.length === 0) return out;

  const looksLikeEvm = dirs.some((d) => /^0x[a-fA-F0-9]{40}$/i.test(d.name));
  const looksLikeTron = dirs.some((d) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(d.name));
  const flatTokens = looksLikeEvm || looksLikeTron || depth >= 2;

  if (flatTokens) {
    for (const d of dirs) out.push(`${chainPath}/${d.name}`);
    return out;
  }

  for (const d of dirs) {
    const nested = await collectTokenLeaves(`${chainPath}/${d.name}`, depth + 1);
    out.push(...nested);
  }
  return out;
}

async function importChain(chain) {
  let leaves;
  try {
    leaves = await collectTokenLeaves(chain);
  } catch (e) {
    console.warn(`skip ${chain}: ${e.message}`);
    return { chain, saved: 0 };
  }

  leaves = leaves.slice(0, limit);
  let saved = 0;
  const index = [];

  for (const leaf of leaves) {
    const parts = leaf.split("/");
    const addr = parts[parts.length - 1];
    const logoUrl = rawUrl(`${leaf}/logo.png`);
    // icons/tokens/bitcoin/brc20/ordi.png or tokens/eth/0x....png
    const relParts = ["tokens", ...parts.slice(0)];
    const rel = `${relParts.join("/")}.png`.replace(/\.png\.png$/, ".png");
    // leaf is chain/.../addr → tokens/chain/.../addr.png
    const relPath = `tokens/${leaf}.png`;
    const dest = join(root, "icons", relPath);
    try {
      if (!existsSync(dest)) {
        await download(logoUrl, dest);
      }
      index.push({
        chainFolder: chain,
        path: leaf,
        address: addr,
        icon: relPath,
      });
      saved += 1;
      console.log(`ok ${leaf}`);
    } catch (e) {
      console.log(`fail ${leaf}: ${e.message}`);
    }
  }

  const safeName = chain.replace(/[()]/g, "");
  mkdirSync(join(root, "tokens"), { recursive: true });
  writeFileSync(
    join(root, `tokens/${safeName}.partial.v1.json`),
    JSON.stringify(
      {
        schema: 1,
        chainFolder: chain,
        updatedAt: new Date().toISOString(),
        note: "Sparse import; not a complete token list. Review license before shipping.",
        tokens: index,
      },
      null,
      2,
    ) + "\n",
  );
  return { chain, saved };
}

async function importNatives() {
  const out = [];
  for (const n of NATIVE_ICONS) {
    const dest = join(root, "icons", n.rel);
    try {
      if (!existsSync(dest)) {
        await download(n.url, dest);
      }
      out.push({ symbol: n.symbol, icon: n.rel, source: "trustwallet/assets" });
      console.log(`native ok ${n.symbol}`);
    } catch (e) {
      console.log(`native fail ${n.symbol}: ${e.message}`);
    }
  }
  writeFileSync(
    join(root, "tokens/natives.v1.json"),
    JSON.stringify(
      {
        schema: 1,
        updatedAt: new Date().toISOString(),
        note: "Native asset icons from trustwallet/assets (MIT).",
        tokens: out,
      },
      null,
      2,
    ) + "\n",
  );
  return out.length;
}

async function main() {
  mkdirSync(join(root, "icons/tokens"), { recursive: true });
  mkdirSync(join(root, "sources"), { recursive: true });
  writeFileSync(
    join(root, "sources/TOKEN_ICONS.md"),
    [
      "# Token icons",
      "",
      "- Sparse import from public community token tree (see script header).",
      "- Native BTC/ETH/TRX/SOL logos from trustwallet/assets (MIT) — community tokens repo has almost no native BTC.",
      "- Full wallet token CDN dumps are huge and often unlicensed for redistribution.",
      `- Chains: ${chains.join(", ")}`,
      `- Cap per chain: ${limit}`,
      "",
    ].join("\n"),
  );

  const natives = await importNatives();
  const summary = [{ natives }];
  for (const c of chains) {
    summary.push(await importChain(c));
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
