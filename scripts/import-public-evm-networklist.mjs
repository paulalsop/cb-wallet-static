#!/usr/bin/env node
/**
 * Import public EVM networklist → cb-wallet-static catalog / rpc / chain icons.
 *
 * Source: https://github.com/TP-Lab/networklist-org (community PR list, GPL-3).
 * We transform into our schema; do NOT keep third-party brand strings in UI fields.
 *
 * Usage:
 *   node scripts/import-public-evm-networklist.mjs
 *   node scripts/import-public-evm-networklist.mjs --skip-icons
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skipIcons = process.argv.includes("--skip-icons");
const SOURCE_URL =
  "https://raw.githubusercontent.com/TP-Lab/networklist-org/main/chains.json";

/** Curated featured order (chainId). Remaining go to public-evm dump. */
const FEATURED_CHAIN_IDS = [
  1, // Ethereum
  56, // BNB Smart Chain
  137, // Polygon
  42161, // Arbitrum One
  10, // Optimism
  8453, // Base
  43114, // Avalanche C-Chain
  250, // Fantom
  100, // Gnosis
  324, // zkSync Era
  59144, // Linea
  534352, // Scroll
  5000, // Mantle
  81457, // Blast
  42220, // Celo
  25, // Cronos
  1284, // Moonbeam
  2222, // Kava EVM
  1088, // Metis
  1101, // Polygon zkEVM
];

const BLOCKED_RPC_SUBSTRINGS = [
  "infura.io",
  "alchemy.com",
  "YOUR-PROJECT-ID",
  "API_KEY",
  "api_key",
  "${",
];

/** Fallback public HTTPS RPCs when community list has empty / key-gated nodes. */
const KNOWN_PUBLIC_RPC = {
  1: ["https://ethereum.publicnode.com", "https://cloudflare-eth.com"],
  10: ["https://mainnet.optimism.io", "https://optimism.publicnode.com"],
  56: [
    "https://bsc-dataseed.binance.org",
    "https://bsc.publicnode.com",
  ],
  100: ["https://rpc.gnosischain.com", "https://gnosis.publicnode.com"],
  137: [
    "https://polygon-bor.publicnode.com",
    "https://polygon-rpc.com",
  ],
  250: ["https://rpc.ftm.tools", "https://fantom.publicnode.com"],
  324: ["https://mainnet.era.zksync.io", "https://zksync.drpc.org"],
  1101: ["https://zkevm-rpc.com", "https://polygon-zkevm.drpc.org"],
  1284: ["https://rpc.api.moonbeam.network", "https://moonbeam.publicnode.com"],
  2222: ["https://evm.kava.io", "https://kava-evm.publicnode.com"],
  5000: ["https://rpc.mantle.xyz", "https://mantle.publicnode.com"],
  8453: ["https://mainnet.base.org", "https://base.publicnode.com"],
  42161: ["https://arb1.arbitrum.io/rpc", "https://arbitrum.publicnode.com"],
  42220: ["https://forno.celo.org", "https://celo.publicnode.com"],
  43114: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche.publicnode.com",
  ],
  59144: ["https://rpc.linea.build", "https://linea.publicnode.com"],
  81457: ["https://rpc.blast.io", "https://blast.publicnode.com"],
  534352: ["https://rpc.scroll.io", "https://scroll.publicnode.com"],
};

const KNOWN_META = {
  8453: {
    name: "Base",
    shortName: "base",
    chain: "ETH",
    network: "mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    infoURL: "https://base.org",
  },
  534352: {
    name: "Scroll",
    shortName: "scr",
    chain: "ETH",
    network: "mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    infoURL: "https://scroll.io",
  },
  1284: {
    name: "Moonbeam",
    shortName: "mbeam",
    chain: "MOON",
    network: "mainnet",
    nativeCurrency: { name: "Glimmer", symbol: "GLMR", decimals: 18 },
    infoURL: "https://moonbeam.network",
  },
};

function sha256File(rel) {
  const buf = readFileSync(join(root, rel));
  return createHash("sha256").update(buf).digest("hex");
}

function slugify(name) {
  return String(name || "chain")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "chain";
}

function networkKind(raw) {
  const n = String(raw || "").toLowerCase();
  if (n.includes("test")) return "testnet";
  if (n.includes("dev")) return "devnet";
  return "mainnet";
}

function filterHttpsRpcs(rpcs) {
  const out = [];
  const seen = new Set();
  for (const r of rpcs || []) {
    if (typeof r !== "string") continue;
    const u = r.trim();
    if (!u.startsWith("https://")) continue;
    if (BLOCKED_RPC_SUBSTRINGS.some((s) => u.includes(s))) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function pickIconUrl(appResource) {
  if (!appResource || typeof appResource !== "object") return null;
  const candidates = [
    appResource.ic_chain_select,
    appResource.icChainSelect,
    appResource.ic_home_logo,
    appResource.icHomeLogo,
    appResource.ic_chain_unselect,
    appResource.icChainUnselect,
  ];
  for (const u of candidates) {
    if (typeof u === "string" && u.startsWith("https://") && !u.includes("drive.google.com")) {
      return u;
    }
  }
  return null;
}

function iconExt(url, contentType) {
  const pathExt = extname(new URL(url).pathname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"].includes(pathExt)) {
    return pathExt === ".jpeg" ? ".jpg" : pathExt;
  }
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return ".jpg";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("svg")) return ".svg";
  return ".png";
}

async function downloadIcon(url, destAbs) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "cb-wallet-static-import/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 32) throw new Error("too small");
  const ct = res.headers.get("content-type") || "";
  const ext = iconExt(url, ct);
  const finalPath = destAbs.endsWith(ext) ? destAbs : `${destAbs.replace(/\.[^.]+$/, "")}${ext}`;
  mkdirSync(dirname(finalPath), { recursive: true });
  writeFileSync(finalPath, buf);
  return finalPath;
}

function toEntry(chain, list, sortIndex, iconRel) {
  const chainId = Number(chain.chainId);
  const kind = networkKind(chain.network);
  const short =
    (chain.shortName && String(chain.shortName).slice(0, 12)) ||
    (chain.nativeCurrency?.symbol && String(chain.nativeCurrency.symbol).slice(0, 12)) ||
    `eid${chainId}`;
  const ar = chain.app_resource || chain.appResource || {};
  const entry = {
    sortIndex,
    list,
    chainKey: `evm-${slugify(chain.shortName || chain.chain || chain.name)}-${chainId}`,
    caip2: `eip155:${chainId}`,
    family: "evm",
    displayName: String(chain.name || `Chain ${chainId}`).slice(0, 80),
    shortName: short,
    networkKind: kind,
    isTestnet: kind !== "mainnet",
    nativeCurrency: {
      name: String(chain.nativeCurrency?.name || short),
      symbol: String(chain.nativeCurrency?.symbol || short),
      decimals: Number(chain.nativeCurrency?.decimals ?? 18),
    },
    evm: { chainId, supportsEip1559: true },
    icon: { default: iconRel || `chains/eip155-${chainId}.png` },
    explorers: [],
    infoUrl:
      typeof chain.infoURL === "string" && chain.infoURL.startsWith("https://")
        ? chain.infoURL
        : undefined,
    publisher: {
      kind: list === "featured" ? "curated" : "imported",
      publishedAt: new Date().toISOString(),
      source: "public-evm-networklist",
    },
    status: "active",
    enabled: true,
    tags: list === "featured" ? [] : ["imported-public"],
  };
  if (ar.color_chain_bg || ar.colorChainBg || ar.color_chain_text || ar.colorChainText) {
    entry.ui = {
      colorBg: ar.color_chain_bg || ar.colorChainBg,
      colorText: ar.color_chain_text || ar.colorChainText,
    };
  }
  // selected / unselected local paths if we saved them
  if (iconRel) {
    entry.icon = { default: iconRel };
  }
  return entry;
}

async function main() {
  console.log("fetch", SOURCE_URL);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error("chains.json not an array");

  mkdirSync(join(root, "sources"), { recursive: true });
  writeFileSync(join(root, "sources/public-evm-networklist.raw.json"), JSON.stringify(raw));
  writeFileSync(
    join(root, "sources/ATTRIBUTION.md"),
    [
      "# Attribution",
      "",
      "- Public EVM network list derived from [TP-Lab/networklist-org](https://github.com/TP-Lab/networklist-org) `chains.json` (GPL-3).",
      "- Transformed into cb-wallet-static schema; product UI must not display third-party wallet brands.",
      "- Chain icons were downloaded from HTTPS URLs present in that list. Review copyright before production redistribute; prefer official / licensed marks.",
      `- Imported at: ${new Date().toISOString()}`,
      "",
    ].join("\n"),
  );

  // Dedupe by chainId (first wins); fill known public RPCs when source empty
  const byId = new Map();
  for (const c of raw) {
    const id = Number(c?.chainId);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (byId.has(id)) continue;
    let urls = filterHttpsRpcs(c.rpc);
    if (urls.length === 0 && KNOWN_PUBLIC_RPC[id]) {
      urls = [...KNOWN_PUBLIC_RPC[id]];
    }
    if (urls.length === 0) continue;
    byId.set(id, { ...c, chainId: id, _rpc: urls });
  }
  for (const [id, meta] of Object.entries(KNOWN_META)) {
    const n = Number(id);
    if (byId.has(n)) continue;
    const urls = KNOWN_PUBLIC_RPC[n];
    if (!urls?.length) continue;
    byId.set(n, { ...meta, chainId: n, _rpc: urls });
  }
  for (const [id, urls] of Object.entries(KNOWN_PUBLIC_RPC)) {
    const n = Number(id);
    const row = byId.get(n);
    if (!row) continue;
    // Prefer known public endpoints first for featured reliability
    const merged = filterHttpsRpcs([...urls, ...row._rpc]);
    row._rpc = merged;
  }
  const iconDir = join(root, "icons/chains");
  mkdirSync(iconDir, { recursive: true });
  const iconRelById = new Map();

  if (!skipIcons) {
    let ok = 0;
    let fail = 0;
    for (const [id, c] of byId) {
      const url = pickIconUrl(c.app_resource || c.appResource);
      if (!url) continue;
      const base = join(iconDir, `eip155-${id}`);
      try {
        const saved = await downloadIcon(url, `${base}.png`);
        const rel = `chains/${saved.split(/icons[\\/]/).pop()}`;
        iconRelById.set(id, rel.replace(/\\/g, "/"));
        ok += 1;
        process.stdout.write(`icon ok ${id}\n`);
      } catch (e) {
        fail += 1;
        process.stdout.write(`icon fail ${id}: ${e.message}\n`);
      }
    }
    console.log(`icons downloaded ok=${ok} fail=${fail}`);
  }

  // Ensure placeholder exists for featured without icon
  for (const id of FEATURED_CHAIN_IDS) {
    if (iconRelById.has(id)) continue;
    const placeholder = join(iconDir, `eip155-${id}.png`);
    if (!existsSync(placeholder) && existsSync(join(iconDir, "eip155-1.png"))) {
      // leave missing; entry still points at expected path
    }
  }

  const featured = [];
  const publicList = [];
  const featuredSet = new Set(FEATURED_CHAIN_IDS);

  for (const id of FEATURED_CHAIN_IDS) {
    const c = byId.get(id);
    if (!c) {
      console.warn(`featured chainId missing in source: ${id}`);
      continue;
    }
    featured.push(
      toEntry(c, "featured", featured.length, iconRelById.get(id)),
    );
  }

  const restIds = [...byId.keys()].sort((a, b) => a - b);
  for (const id of restIds) {
    if (featuredSet.has(id)) continue;
    const c = byId.get(id);
    publicList.push(
      toEntry(c, "public", publicList.length, iconRelById.get(id)),
    );
  }

  // Keep cbPublished empty (reserved for cb one-click publish)
  const catalog = {
    schema: 1,
    catalogId: "cb-wallet-remote-chains-v1",
    updatedAt: new Date().toISOString(),
    featured,
    cbPublished: [],
  };
  writeFileSync(
    join(root, "chains/catalog.v1.json"),
    JSON.stringify(catalog, null, 2) + "\n",
  );

  const publicCatalog = {
    schema: 1,
    catalogId: "cb-wallet-public-evm-v1",
    updatedAt: new Date().toISOString(),
    note: "Imported public EVM networks (not featured / not cbPublished). Promote into featured via admin.",
    chains: publicList,
  };
  writeFileSync(
    join(root, "chains/public-evm.v1.json"),
    JSON.stringify(publicCatalog, null, 2) + "\n",
  );

  // RPC: featured first (same order), then remaining by chainId
  const rpcRows = [];
  for (const id of FEATURED_CHAIN_IDS) {
    const c = byId.get(id);
    if (!c) continue;
    rpcRows.push({
      sortIndex: rpcRows.length,
      caip2: `eip155:${id}`,
      urls: c._rpc.slice(0, 8),
    });
  }
  for (const id of restIds) {
    if (featuredSet.has(id)) continue;
    const c = byId.get(id);
    rpcRows.push({
      sortIndex: rpcRows.length,
      caip2: `eip155:${id}`,
      urls: c._rpc.slice(0, 8),
    });
  }
  writeFileSync(
    join(root, "chains/rpc.v1.json"),
    JSON.stringify({ schema: 1, chains: rpcRows }, null, 2) + "\n",
  );

  // Refresh manifest hashes for known files
  const manifestPath = join(root, "manifest.v1.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.publishedAt = new Date().toISOString();
  for (const key of Object.keys(manifest.files || {})) {
    const p = manifest.files[key].path;
    if (existsSync(join(root, p))) {
      manifest.files[key].sha256 = sha256File(p);
    }
  }
  manifest.files["chains.publicEvm"] = {
    path: "chains/public-evm.v1.json",
    sha256: sha256File("chains/public-evm.v1.json"),
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        featured: featured.length,
        publicEvm: publicList.length,
        rpc: rpcRows.length,
        icons: iconRelById.size,
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
