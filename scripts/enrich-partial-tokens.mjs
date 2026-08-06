/**
 * Enrich tokens/*.partial.v1.json with name/symbol/decimals from trustwallet/assets (MIT).
 * Writes tokens/*.enriched.v1.json — only entries that resolve metadata.
 *
 * Usage: node scripts/enrich-partial-tokens.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TW =
  "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains";

/** partial chainFolder → { caip2, family, chainId?, twBlockchain, chainName } */
const FOLDER_META = {
  eth: {
    caip2: "eip155:1",
    family: "evm",
    chainId: 1,
    tw: "ethereum",
    chainName: "Ethereum Mainnet",
  },
  bsc: {
    caip2: "eip155:56",
    family: "evm",
    chainId: 56,
    tw: "smartchain",
    chainName: "BNB Smart Chain",
  },
  arbitrum: {
    caip2: "eip155:42161",
    family: "evm",
    chainId: 42161,
    tw: "arbitrum",
    chainName: "Arbitrum One",
  },
  base: {
    caip2: "eip155:8453",
    family: "evm",
    chainId: 8453,
    tw: "base",
    chainName: "Base",
  },
  optimistic: {
    caip2: "eip155:10",
    family: "evm",
    chainId: 10,
    tw: "optimism",
    chainName: "Optimistic Ethereum",
  },
  "polygon(matic)": {
    caip2: "eip155:137",
    family: "evm",
    chainId: 137,
    tw: "polygon",
    chainName: "Polygon (Matic) Mainnet",
  },
  "Avalanche-C": {
    caip2: "eip155:43114",
    family: "evm",
    chainId: 43114,
    tw: "avalanchec",
    chainName: "Avalanche C-Chain",
  },
  solana: {
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    family: "solana",
    tw: "solana",
    chainName: "Solana",
  },
  tron: {
    caip2: "tron:mainnet",
    family: "tron",
    tw: "tron",
    chainName: "TRON",
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPlausibleAddress(addr, family) {
  if (!addr || typeof addr !== "string") return false;
  const a = addr.trim();
  if (!a || a === "native") return false;
  const lower = a.toLowerCase();
  if (["eth", "tron", "bitcoin", "solana", "bnb"].includes(lower)) return false;
  if (/^0x0+$/i.test(a)) return false;
  if (family === "evm") return /^0x[a-fA-F0-9]{40}$/.test(a);
  if (family === "tron") return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a);
  if (family === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  return a.length >= 4;
}

async function fetchInfo(twChain, address) {
  const candidates = [address];
  if (address.startsWith("0x") && address.length === 42) {
    // try checksum-ish: keep original, lower, and common TW form
    candidates.push(address.toLowerCase());
  }
  for (const id of candidates) {
    const url = `${TW}/${twChain}/assets/${encodeURIComponent(id)}/info.json`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const j = await res.json();
      if (j?.symbol && j?.name) return j;
    } catch {
      // continue
    }
  }
  return null;
}

async function enrichPartial(filePath) {
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const folder = raw.chainFolder;
  const meta = FOLDER_META[folder];
  if (!meta) {
    console.log(`skip unknown folder ${folder}`);
    return null;
  }

  const out = [];
  let hit = 0;
  let miss = 0;
  for (const t of raw.tokens ?? []) {
    const address = t.address;
    if (!isPlausibleAddress(address, meta.family)) {
      miss += 1;
      continue;
    }
    const info = await fetchInfo(meta.tw, address);
    await sleep(40);
    if (!info) {
      miss += 1;
      continue;
    }
    hit += 1;
    const addressKey =
      meta.family === "evm" ? address.toLowerCase() : address;
    const kind =
      meta.family === "evm"
        ? "erc20"
        : meta.family === "tron"
          ? "trc20"
          : "spl";
    const tokenKey = `${meta.caip2}/${kind}:${addressKey}`;
    out.push({
      sortIndex: out.length,
      tokenKey,
      caip2: meta.caip2,
      chainName: meta.chainName,
      family: meta.family,
      ...(meta.chainId != null ? { chainId: meta.chainId } : {}),
      address: info.id || address,
      addressKey,
      symbol: String(info.symbol).trim(),
      name: String(info.name).trim(),
      decimals:
        typeof info.decimals === "number" ? info.decimals : null,
      displayHint: `${info.symbol} · ${meta.chainName} · ${meta.caip2}`,
      icon: { default: t.icon },
      status: info.status === "active" ? "active" : info.status || "active",
      enabled: true,
      tags: ["enriched-partial", folder],
      sources: ["partial+trustwallet"],
    });
  }

  const outName = `tokens/${folder.replace(/[()]/g, "")}.enriched.v1.json`;
  // normalize filename: polygon(matic) → polygonmatic
  const safeFolder = folder.replace(/[()]/g, "");
  const rel = `tokens/${safeFolder}.enriched.v1.json`;
  const payload = {
    schema: 1,
    catalogId: `cb-wallet-${safeFolder}-enriched-v1`,
    updatedAt: new Date().toISOString(),
    caip2: meta.caip2,
    chainName: meta.chainName,
    rule: "Enriched from partial icons + trustwallet info.json. Primary key tokenKey.",
    tokenCount: out.length,
    tokens: out.map((t, i) => ({ ...t, sortIndex: i })),
  };
  writeFileSync(join(root, rel), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`${folder}: hit=${hit} miss=${miss} → ${rel}`);
  return rel;
}

async function main() {
  const dir = join(root, "tokens");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".partial.v1.json"))
    .map((f) => join(dir, f));
  for (const f of files) {
    await enrichPartial(f);
  }
  console.log("done — run: node scripts/build-token-catalog.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
