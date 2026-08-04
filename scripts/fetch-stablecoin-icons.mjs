#!/usr/bin/env node
/**
 * Curated per-chain stablecoins (USDT / USDC / DAI …).
 * Identity = caip2 + contract address — NEVER symbol alone.
 *
 * Icons: trustwallet/assets (MIT), stored under
 *   icons/tokens/eip155-<chainId>/<address>.png
 * so the same ticker on different chains cannot collide on disk.
 *
 * Usage: node scripts/fetch-stablecoin-icons.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Curated list. Each row is a distinct asset on one chain.
 * twSlug = trustwallet/assets blockchains/<slug>
 */
const STABLES = [
  // —— USDT ——
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:1",
    chainId: 1,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    twSlug: "ethereum",
    kind: "native-issued",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:56",
    chainId: 56,
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    twSlug: "smartchain",
    kind: "bridged",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:137",
    chainId: 137,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    twSlug: "polygon",
    kind: "bridged",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:42161",
    chainId: 42161,
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6,
    twSlug: "arbitrum",
    kind: "bridged",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:10",
    chainId: 10,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    decimals: 6,
    twSlug: "optimism",
    kind: "bridged",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:43114",
    chainId: 43114,
    address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    decimals: 6,
    twSlug: "avalanchec",
    kind: "bridged",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "eip155:8453",
    chainId: 8453,
    // Base has limited native USDT; common bridged listing
    address: "0xfde4C96c8593536E31F787dA6BFdAB9A9434E8d1",
    decimals: 6,
    twSlug: "base",
    kind: "bridged",
    optional: true,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "tron:mainnet",
    family: "tron",
    address: "TR7NHqjeKQxGTCi5q8t4xwpAUk3VPQW2w",
    decimals: 6,
    twSlug: "tron",
    kind: "native-issued",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    caip2: "solana:mainnet",
    family: "solana",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    twSlug: "solana",
    kind: "bridged",
  },

  // —— USDC (Circle native where noted) ——
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:1",
    chainId: 1,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    twSlug: "ethereum",
    kind: "native-issued",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:56",
    chainId: 56,
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    twSlug: "smartchain",
    kind: "bridged",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:137",
    chainId: 137,
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    twSlug: "polygon",
    kind: "native-issued",
  },
  {
    symbol: "USDC.e",
    name: "Bridged USD Coin (PoS)",
    caip2: "eip155:137",
    chainId: 137,
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6,
    twSlug: "polygon",
    kind: "bridged",
    note: "Legacy bridged USDC on Polygon — distinct from native USDC",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:42161",
    chainId: 42161,
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    twSlug: "arbitrum",
    kind: "native-issued",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:10",
    chainId: 10,
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    twSlug: "optimism",
    kind: "native-issued",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:8453",
    chainId: 8453,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    twSlug: "base",
    kind: "native-issued",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "eip155:43114",
    chainId: 43114,
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
    twSlug: "avalanchec",
    kind: "native-issued",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    caip2: "solana:mainnet",
    family: "solana",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    twSlug: "solana",
    kind: "native-issued",
  },

  // —— DAI ——
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    caip2: "eip155:1",
    chainId: 1,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    twSlug: "ethereum",
    kind: "native-issued",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    caip2: "eip155:137",
    chainId: 137,
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    decimals: 18,
    twSlug: "polygon",
    kind: "bridged",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    caip2: "eip155:42161",
    chainId: 42161,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18,
    twSlug: "arbitrum",
    kind: "bridged",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    caip2: "eip155:10",
    chainId: 10,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18,
    twSlug: "optimism",
    kind: "bridged",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    caip2: "eip155:8453",
    chainId: 8453,
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
    twSlug: "base",
    kind: "bridged",
  },
];

function tokenKey(row) {
  const addr = normalizeAddr(row);
  if (row.caip2.startsWith("eip155:")) {
    return `${row.caip2}/erc20:${addr}`;
  }
  if (row.caip2.startsWith("tron:")) {
    return `${row.caip2}/trc20:${addr}`;
  }
  if (row.caip2.startsWith("solana:")) {
    return `${row.caip2}/token:${addr}`;
  }
  return `${row.caip2}/asset:${addr}`;
}

function normalizeAddr(row) {
  if (row.caip2.startsWith("eip155:")) return row.address.toLowerCase();
  return row.address;
}

function iconRel(row) {
  const addr = normalizeAddr(row);
  if (row.chainId != null) {
    return `tokens/eip155-${row.chainId}/${addr}.png`;
  }
  if (row.caip2.startsWith("tron:")) return `tokens/tron/${addr}.png`;
  if (row.caip2.startsWith("solana:")) return `tokens/solana/${addr}.png`;
  return `tokens/${row.caip2.replace(":", "-")}/${addr}.png`;
}

function twUrls(row) {
  const addr = row.address;
  // trustwallet keeps checksum case for EVM asset folders
  const paths = [
    `blockchains/${row.twSlug}/assets/${addr}/logo.png`,
  ];
  if (row.caip2.startsWith("eip155:") && addr !== row.address.toLowerCase()) {
    paths.push(`blockchains/${row.twSlug}/assets/${addr.toLowerCase()}/logo.png`);
  }
  const out = [];
  for (const p of paths) {
    out.push(`https://cdn.jsdelivr.net/gh/trustwallet/assets@master/${p}`);
    out.push(`https://raw.githubusercontent.com/trustwallet/assets/master/${p}`);
  }
  return out;
}

async function download(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "cb-wallet-static-stables/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error(`too small ${buf.length}`);
  return buf;
}

function sha256File(rel) {
  return createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");
}

async function main() {
  const keys = new Set();
  const byChainSymbol = new Map();
  const tokens = [];
  const contentHashToKeys = new Map();

  for (const row of STABLES) {
    const key = tokenKey(row);
    if (keys.has(key)) throw new Error(`duplicate tokenKey ${key}`);
    keys.add(key);

    const symKey = `${row.caip2}::${row.symbol}`;
    // Same symbol on same chain OK only if different addresses (e.g. USDC vs USDC.e)
    const prev = byChainSymbol.get(symKey) || [];
    prev.push(key);
    byChainSymbol.set(symKey, prev);

    const rel = iconRel(row);
    const abs = join(root, "icons", rel);
    mkdirSync(dirname(abs), { recursive: true });

    let buf = null;
    let source = null;
    for (const u of twUrls(row)) {
      try {
        buf = await download(u);
        source = u;
        break;
      } catch {
        /* try next */
      }
    }

    if (!buf) {
      // Branding fallback: copy Ethereum USDT/USDC pixels but keep chain-scoped path
      if (row.symbol === "USDT" || row.symbol.startsWith("USDC")) {
        const ethAddr =
          row.symbol === "USDT"
            ? "0xdac17f958d2ee523a2206206994597c13d831ec7"
            : "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
        const fallback = join(
          root,
          "icons/tokens/eip155-1",
          `${ethAddr}.png`,
        );
        if (existsSync(fallback)) {
          buf = readFileSync(fallback);
          source = `fallback-branding:${fallback}`;
        }
      }
    }

    if (!buf) {
      if (row.optional) {
        console.log(`skip optional ${key}`);
        continue;
      }
      console.log(`WARN no icon for ${key} — entry kept without local icon`);
    } else {
      writeFileSync(abs, buf);
      const h = createHash("sha256").update(buf).digest("hex");
      const list = contentHashToKeys.get(h) || [];
      list.push(key);
      contentHashToKeys.set(h, list);
      // Same logo bytes across chains is OK (USDT branding), but paths MUST differ.
      console.log(`ok ${rel} (${buf.length}B)`);
    }

    tokens.push({
      sortIndex: tokens.length,
      tokenKey: key,
      caip2: row.caip2,
      family: row.family || "evm",
      chainId: row.chainId,
      address: row.caip2.startsWith("eip155:")
        ? row.address // keep canonical checksum for explorers
        : row.address,
      addressKey: normalizeAddr(row),
      symbol: row.symbol,
      name: row.name,
      decimals: row.decimals,
      kind: row.kind,
      note: row.note,
      // UI must show chain; never treat symbol as global id
      displayHint: `${row.symbol} · ${row.caip2}`,
      icon: buf ? { default: rel } : undefined,
      iconSource: source || undefined,
      status: "active",
      enabled: true,
      tags: ["stablecoin", row.symbol.replace(".", "-").toLowerCase()],
    });
  }

  // Warn if identical symbol appears without chain in client mistakes
  for (const [symKey, list] of byChainSymbol) {
    if (list.length > 1) {
      console.log(`multi-asset same symbol on chain: ${symKey} → ${list.join(", ")}`);
    }
  }

  const sameBytes = [...contentHashToKeys.entries()].filter(([, ks]) => ks.length > 1);
  if (sameBytes.length) {
    console.log(
      `note: ${sameBytes.length} icon content-hash group(s) shared across chains (branding reuse OK; paths are unique)`,
    );
  }

  const catalog = {
    schema: 1,
    catalogId: "cb-wallet-stablecoins-v1",
    updatedAt: new Date().toISOString(),
    rule: "Identity is tokenKey (caip2 + address). Symbol is NOT unique across chains.",
    tokens,
  };

  mkdirSync(join(root, "tokens"), { recursive: true });
  writeFileSync(
    join(root, "tokens/stablecoins.v1.json"),
    JSON.stringify(catalog, null, 2) + "\n",
  );

  // Lightweight assert
  const seen = new Set();
  for (const t of tokens) {
    if (seen.has(t.tokenKey)) throw new Error(`dup ${t.tokenKey}`);
    seen.add(t.tokenKey);
    if (!t.caip2 || !t.addressKey || !t.symbol) {
      throw new Error(`incomplete ${t.tokenKey}`);
    }
  }

  const manifestPath = join(root, "manifest.v1.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.publishedAt = new Date().toISOString();
    manifest.files = manifest.files || {};
    manifest.files["tokens.stablecoins"] = {
      path: "tokens/stablecoins.v1.json",
      sha256: sha256File("tokens/stablecoins.v1.json"),
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  writeFileSync(
    join(root, "sources/STABLECOINS.md"),
    [
      "# Per-chain stablecoins",
      "",
      "- Do **not** key assets by `USDT` / `USDC` alone.",
      "- Use `tokenKey` = `caip2` + contract (`eip155:1/erc20:0xdac1…`).",
      "- Icons live under `icons/tokens/eip155-<chainId>/<address>.png` (path unique per chain).",
      "- Source logos: trustwallet/assets (MIT).",
      `- Count: ${tokens.length}`,
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify({ count: tokens.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
