/**
 * Import curated public token lists (name + symbol + chain + address).
 * Sources: Uniswap default list + PancakeSwap extended (no third-party wallet brands).
 *
 * Writes:
 *   tokens/lists.curated.v1.json
 *   icons/tokens/eip155-<chainId>/<address>.png  (best-effort download)
 *
 * Then run: node scripts/build-token-catalog.mjs
 *
 * Usage:
 *   node scripts/import-public-tokenlists.mjs
 *   node scripts/import-public-tokenlists.mjs --limit 60
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const perChainLimit = Number(arg("--limit", "60"));

const CHAIN_META = {
  1: {
    caip2: "eip155:1",
    chainName: "Ethereum Mainnet",
    family: "evm",
  },
  56: {
    caip2: "eip155:56",
    chainName: "BNB Smart Chain",
    family: "evm",
  },
  137: {
    caip2: "eip155:137",
    chainName: "Polygon (Matic) Mainnet",
    family: "evm",
  },
  10: {
    caip2: "eip155:10",
    chainName: "Optimistic Ethereum",
    family: "evm",
  },
  42161: {
    caip2: "eip155:42161",
    chainName: "Arbitrum One",
    family: "evm",
  },
  8453: {
    caip2: "eip155:8453",
    chainName: "Base",
    family: "evm",
  },
  43114: {
    caip2: "eip155:43114",
    chainName: "Avalanche C-Chain",
    family: "evm",
  },
};

const SOURCES = [
  {
    id: "uniswap-default",
    url: "https://tokens.uniswap.org",
  },
  {
    id: "pancakeswap-extended",
    url: "https://tokens.pancakeswap.finance/pancakeswap-extended.json",
  },
];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

function isEvmAddress(a) {
  return typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a);
}

async function downloadIcon(logoURI, absPath) {
  if (!logoURI || existsSync(absPath)) return existsSync(absPath);
  try {
    const res = await fetch(logoURI, { redirect: "follow" });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 64 || buf.length > 2_000_000) return false;
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const byKey = new Map();
  const counts = Object.fromEntries(
    Object.keys(CHAIN_META).map((id) => [Number(id), 0]),
  );

  for (const src of SOURCES) {
    console.log(`fetch ${src.id}…`);
    const doc = await fetchJson(src.url);
    const tokens = Array.isArray(doc.tokens) ? doc.tokens : [];
    for (const t of tokens) {
      const chainId = Number(t.chainId);
      const meta = CHAIN_META[chainId];
      if (!meta) continue;
      if (counts[chainId] >= perChainLimit) continue;
      if (!isEvmAddress(t.address)) continue;
      const symbol = String(t.symbol ?? "").trim();
      const name = String(t.name ?? symbol).trim();
      if (!symbol || !name) continue;
      if (symbol.length > 24 || name.length > 80) continue;

      const address = t.address;
      const addressKey = address.toLowerCase();
      const tokenKey = `${meta.caip2}/erc20:${addressKey}`;
      if (byKey.has(tokenKey)) continue;

      const iconRel = `tokens/eip155-${chainId}/${addressKey}.png`;
      const absIcon = join(root, "icons", iconRel);
      const got = await downloadIcon(t.logoURI, absIcon);

      byKey.set(tokenKey, {
        tokenKey,
        caip2: meta.caip2,
        chainName: meta.chainName,
        family: meta.family,
        chainId,
        address,
        addressKey,
        symbol,
        name,
        decimals: Number.isInteger(t.decimals) ? t.decimals : null,
        displayHint: `${symbol} · ${meta.chainName} · ${meta.caip2}`,
        ...(got ? { icon: { default: iconRel } } : {}),
        status: "active",
        enabled: true,
        tags: ["tokenlist", src.id],
        sources: [src.id],
      });
      counts[chainId] += 1;
    }
  }

  const list = [...byKey.values()].sort((a, b) => {
    if (a.chainId !== b.chainId) return a.chainId - b.chainId;
    return a.symbol.localeCompare(b.symbol);
  });

  const payload = {
    schema: 1,
    catalogId: "cb-wallet-tokenlists-curated-v1",
    updatedAt: new Date().toISOString(),
    rule:
      "Curated from public token lists. Primary key tokenKey (caip2+address). Never merge by symbol.",
    perChainLimit,
    tokenCount: list.length,
    byChainId: counts,
    tokens: list.map((t, i) => ({ sortIndex: i, ...t })),
  };

  writeFileSync(
    join(root, "tokens/lists.curated.v1.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  console.log("wrote tokens/lists.curated.v1.json", payload.tokenCount, counts);
  console.log("next: node scripts/build-token-catalog.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
