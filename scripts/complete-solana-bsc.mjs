#!/usr/bin/env node
/**
 * Complete Solana + BSC curated chain / RPC / popular tokens / stables.
 * Solana caip2 matches wallet: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
 *
 * Usage: node scripts/complete-solana-bsc.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOLANA_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

const BSC_POPULAR = [
  {
    symbol: "BNB",
    name: "BNB",
    address: "native",
    decimals: 18,
    iconUrl:
      "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/smartchain/info/logo.png",
    iconRel: "tokens/eip155-56/native.png",
  },
  {
    symbol: "WBNB",
    name: "Wrapped BNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    decimals: 18,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
  },
  {
    symbol: "FDUSD",
    name: "First Digital USD",
    address: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
    decimals: 18,
  },
  {
    symbol: "ETH",
    name: "Ethereum Token",
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    decimals: 18,
  },
  {
    symbol: "BTCB",
    name: "BTCB Token",
    address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    decimals: 18,
  },
  {
    symbol: "DAI",
    name: "Dai Token",
    address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    decimals: 18,
  },
  {
    symbol: "CAKE",
    name: "PancakeSwap Token",
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    decimals: 18,
  },
];

const SOLANA_POPULAR = [
  {
    symbol: "SOL",
    name: "Solana",
    address: "native",
    decimals: 9,
    iconUrl:
      "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png",
    iconRel: "tokens/solana/native.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
  },
  {
    symbol: "BONK",
    name: "Bonk",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    decimals: 6,
  },
  {
    symbol: "RAY",
    name: "Raydium",
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
  },
  {
    symbol: "PYUSD",
    name: "PayPal USD",
    address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    decimals: 6,
    optional: true,
  },
];

const EXTRA_STABLES = [
  {
    symbol: "FDUSD",
    name: "First Digital USD",
    caip2: "eip155:56",
    chainId: 56,
    address: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
    decimals: 18,
    kind: "native-issued",
    family: "evm",
  },
  {
    symbol: "DAI",
    name: "Dai Token",
    caip2: "eip155:56",
    chainId: 56,
    address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    decimals: 18,
    kind: "bridged",
    family: "evm",
  },
  {
    symbol: "PYUSD",
    name: "PayPal USD",
    caip2: SOLANA_CAIP2,
    family: "solana",
    address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    decimals: 6,
    kind: "native-issued",
    optional: true,
  },
];

function load(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function save(rel, obj) {
  writeFileSync(join(root, rel), JSON.stringify(obj, null, 2) + "\n");
}

function sha256File(rel) {
  return createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");
}

async function download(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "cb-wallet-static-sol-bsc/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error(`too small ${buf.length}`);
  return buf;
}

async function downloadTo(rel, urls) {
  const abs = join(root, "icons", rel);
  mkdirSync(dirname(abs), { recursive: true });
  for (const u of urls) {
    try {
      const buf = await download(u);
      writeFileSync(abs, buf);
      console.log(`ok icons/${rel} (${buf.length}B)`);
      return true;
    } catch (e) {
      console.log(`fail ${rel} ${u}: ${e.message}`);
    }
  }
  return false;
}

function twAsset(slug, address) {
  return [
    `https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/${slug}/assets/${address}/logo.png`,
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${slug}/assets/${address}/logo.png`,
  ];
}

function reindex(list, listName) {
  list.forEach((item, i) => {
    item.sortIndex = i;
    item.list = listName;
  });
}

function upsertFeatured(catalog, entry, afterCaip2) {
  const featured = catalog.featured;
  const idx = featured.findIndex((c) => c.caip2 === entry.caip2);
  if (idx >= 0) {
    featured[idx] = { ...featured[idx], ...entry, sortIndex: idx, list: "featured" };
  } else {
    let insertAt = featured.findIndex((c) => c.caip2 === afterCaip2);
    insertAt = insertAt >= 0 ? insertAt + 1 : featured.length;
    featured.splice(insertAt, 0, entry);
  }
  reindex(featured, "featured");
}

function upsertRpc(rpc, caip2, urls, afterCaip2) {
  const rows = rpc.chains;
  const idx = rows.findIndex((r) => r.caip2 === caip2);
  const row = { caip2, urls };
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...row };
  } else {
    let insertAt = rows.findIndex((r) => r.caip2 === afterCaip2);
    insertAt = insertAt >= 0 ? insertAt + 1 : rows.length;
    rows.splice(insertAt, 0, row);
  }
  rows.forEach((r, i) => {
    r.sortIndex = i;
  });
}

async function importPopular(chainLabel, caip2, family, chainId, twSlug, items) {
  const out = [];
  for (const item of items) {
    const addressKey =
      item.address === "native"
        ? "native"
        : family === "evm"
          ? item.address.toLowerCase()
          : item.address;
    const iconRel =
      item.iconRel ||
      (family === "evm"
        ? `tokens/eip155-${chainId}/${addressKey}.png`
        : `tokens/solana/${addressKey}.png`);

    let ok = false;
    if (item.iconUrl) {
      ok = await downloadTo(iconRel, [item.iconUrl]);
    } else if (item.address !== "native") {
      ok = await downloadTo(iconRel, twAsset(twSlug, item.address));
      if (!ok && family === "evm") {
        ok = await downloadTo(iconRel, twAsset(twSlug, item.address.toLowerCase()));
      }
    }

    // fallback: copy from existing stablecoin path if present
    if (!ok && family === "evm" && item.address !== "native") {
      const alt = join(
        root,
        "icons/tokens",
        `eip155-${chainId}`,
        `${item.address.toLowerCase()}.png`,
      );
      if (existsSync(alt)) {
        mkdirSync(dirname(join(root, "icons", iconRel)), { recursive: true });
        copyFileSync(alt, join(root, "icons", iconRel));
        ok = true;
        console.log(`ok icons/${iconRel} (copy)`);
      }
    }

    if (!ok && item.optional) {
      console.log(`skip optional ${chainLabel} ${item.symbol}`);
      continue;
    }

    const tokenKey =
      item.address === "native"
        ? `${caip2}/native`
        : family === "evm"
          ? `${caip2}/erc20:${addressKey}`
          : `${caip2}/token:${addressKey}`;

    out.push({
      sortIndex: out.length,
      tokenKey,
      caip2,
      family,
      chainId,
      address: item.address === "native" ? null : item.address,
      addressKey,
      symbol: item.symbol,
      name: item.name,
      decimals: item.decimals,
      displayHint: `${item.symbol} · ${caip2}`,
      icon: ok ? { default: iconRel } : undefined,
      status: "active",
      enabled: true,
      tags: ["popular", chainLabel],
    });
  }
  return out;
}

function mergeStables(existing, extras) {
  const byKey = new Map(existing.tokens.map((t) => [t.tokenKey, t]));

  // migrate solana:mainnet → official caip2
  for (const [key, t] of [...byKey.entries()]) {
    if (key.startsWith("solana:mainnet/")) {
      byKey.delete(key);
      const next = {
        ...t,
        caip2: SOLANA_CAIP2,
        tokenKey: key.replace("solana:mainnet/", `${SOLANA_CAIP2}/`),
        displayHint: t.displayHint?.replace("solana:mainnet", SOLANA_CAIP2),
      };
      byKey.set(next.tokenKey, next);
      console.log(`migrate stable ${key} → ${next.tokenKey}`);
    }
  }

  for (const row of extras) {
    const addressKey =
      row.family === "solana" ? row.address : row.address.toLowerCase();
    const tokenKey =
      row.family === "solana"
        ? `${row.caip2}/token:${addressKey}`
        : `${row.caip2}/erc20:${addressKey}`;
    const iconRel =
      row.family === "solana"
        ? `tokens/solana/${addressKey}.png`
        : `tokens/eip155-${row.chainId}/${addressKey}.png`;
    const iconAbs = join(root, "icons", iconRel);
    const hasIcon = existsSync(iconAbs);
    byKey.set(tokenKey, {
      sortIndex: 0,
      tokenKey,
      caip2: row.caip2,
      family: row.family || "evm",
      chainId: row.chainId,
      address: row.address,
      addressKey,
      symbol: row.symbol,
      name: row.name,
      decimals: row.decimals,
      kind: row.kind,
      displayHint: `${row.symbol} · ${row.caip2}`,
      icon: hasIcon ? { default: iconRel } : undefined,
      status: "active",
      enabled: true,
      tags: ["stablecoin", row.symbol.toLowerCase()],
    });
  }

  const tokens = [...byKey.values()];
  tokens.forEach((t, i) => {
    t.sortIndex = i;
  });
  return {
    schema: 1,
    catalogId: "cb-wallet-stablecoins-v1",
    updatedAt: new Date().toISOString(),
    rule: "Identity is tokenKey (caip2 + address). Symbol is NOT unique across chains.",
    tokens,
  };
}

async function main() {
  // chain icons
  await downloadTo("chains/eip155-56.png", [
    "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/smartchain/info/logo.png",
  ]);
  await downloadTo("chains/solana-mainnet.png", [
    "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png",
  ]);

  const catalog = load("chains/catalog.v1.json");

  upsertFeatured(
    catalog,
    {
      sortIndex: 0,
      list: "featured",
      chainKey: "evm-bsc-mainnet",
      caip2: "eip155:56",
      family: "evm",
      displayName: "BNB Smart Chain",
      shortName: "BSC",
      networkKind: "mainnet",
      isTestnet: false,
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      evm: { chainId: 56, supportsEip1559: true },
      icon: { default: "chains/eip155-56.png" },
      explorers: [
        { sortIndex: 0, name: "BscScan", url: "https://bscscan.com" },
      ],
      infoUrl: "https://www.bnbchain.org",
      publisher: {
        kind: "curated",
        publishedAt: new Date().toISOString(),
        source: "complete-solana-bsc",
      },
      status: "active",
      enabled: true,
      tags: [],
    },
    "eip155:1",
  );

  upsertFeatured(
    catalog,
    {
      sortIndex: 0,
      list: "featured",
      chainKey: "solana-mainnet",
      caip2: SOLANA_CAIP2,
      family: "solana",
      displayName: "Solana",
      shortName: "SOL",
      networkKind: "mainnet",
      isTestnet: false,
      nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
      icon: { default: "chains/solana-mainnet.png" },
      explorers: [
        { sortIndex: 0, name: "Solscan", url: "https://solscan.io" },
        { sortIndex: 1, name: "Solana Explorer", url: "https://explorer.solana.com" },
      ],
      infoUrl: "https://solana.com",
      publisher: {
        kind: "curated",
        publishedAt: new Date().toISOString(),
        source: "complete-solana-bsc",
      },
      status: "active",
      enabled: true,
      tags: [],
    },
    "eip155:56",
  );

  catalog.updatedAt = new Date().toISOString();
  save("chains/catalog.v1.json", catalog);

  const rpc = load("chains/rpc.v1.json");
  upsertRpc(
    rpc,
    "eip155:56",
    [
      "https://bsc-dataseed.binance.org",
      "https://bsc.publicnode.com",
      "https://bsc-dataseed1.binance.org",
      "https://bsc-dataseed2.binance.org",
      "https://rpc.ankr.com/bsc",
    ],
    "eip155:1",
  );
  upsertRpc(
    rpc,
    SOLANA_CAIP2,
    [
      "https://api.mainnet-beta.solana.com",
      "https://solana-rpc.publicnode.com",
      "https://rpc.ankr.com/solana",
    ],
    "eip155:56",
  );
  save("chains/rpc.v1.json", rpc);

  const bscTokens = await importPopular(
    "bsc",
    "eip155:56",
    "evm",
    56,
    "smartchain",
    BSC_POPULAR,
  );
  save("tokens/bsc.popular.v1.json", {
    schema: 1,
    catalogId: "cb-wallet-bsc-popular-v1",
    updatedAt: new Date().toISOString(),
    caip2: "eip155:56",
    rule: "Per-chain tokens; never merge by symbol across chains.",
    tokens: bscTokens,
  });

  const solTokens = await importPopular(
    "solana",
    SOLANA_CAIP2,
    "solana",
    undefined,
    "solana",
    SOLANA_POPULAR,
  );
  save("tokens/solana.popular.v1.json", {
    schema: 1,
    catalogId: "cb-wallet-solana-popular-v1",
    updatedAt: new Date().toISOString(),
    caip2: SOLANA_CAIP2,
    rule: "Per-chain tokens; never merge by symbol across chains.",
    tokens: solTokens,
  });

  // ensure extra stable icons exist then merge catalog
  for (const row of EXTRA_STABLES) {
    if (row.family === "solana") {
      await downloadTo(`tokens/solana/${row.address}.png`, twAsset("solana", row.address));
    } else {
      await downloadTo(
        `tokens/eip155-${row.chainId}/${row.address.toLowerCase()}.png`,
        twAsset("smartchain", row.address),
      );
    }
  }

  const stables = mergeStables(load("tokens/stablecoins.v1.json"), EXTRA_STABLES);
  save("tokens/stablecoins.v1.json", stables);

  // also keep SOL.png / BNB convenience copies
  const solNative = join(root, "icons/tokens/solana/native.png");
  const solPng = join(root, "icons/tokens/solana/SOL.png");
  if (existsSync(solNative)) copyFileSync(solNative, solPng);
  const bnbNative = join(root, "icons/tokens/eip155-56/native.png");
  const bnbPng = join(root, "icons/tokens/eip155-56/BNB.png");
  if (existsSync(bnbNative)) copyFileSync(bnbNative, bnbPng);

  const manifest = load("manifest.v1.json");
  manifest.publishedAt = new Date().toISOString();
  for (const [key, path] of [
    ["chains.catalog", "chains/catalog.v1.json"],
    ["chains.rpc", "chains/rpc.v1.json"],
    ["tokens.stablecoins", "tokens/stablecoins.v1.json"],
    ["tokens.bscPopular", "tokens/bsc.popular.v1.json"],
    ["tokens.solanaPopular", "tokens/solana.popular.v1.json"],
  ]) {
    manifest.files[key] = { path, sha256: sha256File(path) };
  }
  save("manifest.v1.json", manifest);

  console.log(
    JSON.stringify(
      {
        featuredSolana: catalog.featured.some((c) => c.caip2 === SOLANA_CAIP2),
        featuredBsc: catalog.featured.some((c) => c.caip2 === "eip155:56"),
        bscPopular: bscTokens.length,
        solPopular: solTokens.length,
        stables: stables.tokens.length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
