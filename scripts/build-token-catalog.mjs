/**
 * Build curated token catalog that is human- and machine-queryable.
 *
 * Inputs (rich metadata only — not *.partial icon dumps):
 *   tokens/natives.v1.json
 *   tokens/stablecoins.v1.json
 *   tokens/bsc.popular.v1.json
 *   tokens/solana.popular.v1.json
 *   chains/catalog.v1.json  → chainName lookup
 *
 * Outputs:
 *   tokens/catalog.v1.json   — flat list, primary key tokenKey = caip2 + asset
 *   tokens/by-chain.v1.json  — grouped by caip2 for "which tokens on this chain"
 *   manifest.v1.json         — sha256 for tokens.catalog / tokens.byChain
 *
 * Rules:
 *   - Never merge two chains by symbol (USDT on ETH ≠ USDT on BSC)
 *   - displayHint always includes caip2
 *   - sortIndex contiguous per list / per chain group
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

function writeJson(rel, value) {
  writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
}

function sha256File(rel) {
  const buf = readFileSync(path.join(root, rel));
  return createHash("sha256").update(buf).digest("hex");
}

function chainNameMap(catalog) {
  const map = new Map();
  for (const list of [catalog.featured ?? [], catalog.cbPublished ?? []]) {
    for (const c of list) {
      if (c.caip2 && c.displayName) map.set(c.caip2, c.displayName);
    }
  }
  // Fallbacks for natives not yet in featured.
  const fallback = {
    "bip122:000000000019d6689c085ae165831e93": "Bitcoin",
    "eip155:1": "Ethereum Mainnet",
    "eip155:56": "BNB Smart Chain",
    "tron:mainnet": "TRON",
    "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "Solana",
  };
  for (const [k, v] of Object.entries(fallback)) {
    if (!map.has(k)) map.set(k, v);
  }
  return map;
}

function normalizeEntry(raw, chainNames, source) {
  const caip2 = raw.caip2;
  if (!caip2 || typeof caip2 !== "string") {
    throw new Error(`missing caip2 in ${source}: ${JSON.stringify(raw)}`);
  }
  const symbol = String(raw.symbol ?? "").trim();
  const name = String(raw.name ?? symbol).trim();
  if (!symbol) throw new Error(`missing symbol in ${source}`);

  const address =
    raw.address === null || raw.address === undefined
      ? null
      : String(raw.address);
  const addressKey =
    raw.addressKey ??
    (address ? address.toLowerCase() : "native");
  const tokenKey =
    raw.tokenKey ??
    (address
      ? `${caip2}/${raw.family === "solana" ? "spl" : raw.family === "tron" ? "trc20" : "erc20"}:${addressKey}`
      : `${caip2}/native`);

  const iconPath =
    typeof raw.icon === "string"
      ? raw.icon
      : raw.icon?.default ?? null;

  const chainName = raw.chainName ?? chainNames.get(caip2) ?? caip2;
  const displayHint =
    raw.displayHint ?? `${symbol} · ${chainName} · ${caip2}`;

  return {
    tokenKey,
    caip2,
    chainName,
    family: raw.family ?? inferFamily(caip2),
    chainId: raw.chainId ?? inferChainId(caip2),
    address,
    addressKey,
    symbol,
    name,
    decimals: raw.decimals ?? null,
    displayHint,
    icon: iconPath ? { default: iconPath } : undefined,
    status: raw.status ?? "active",
    enabled: raw.enabled !== false,
    tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
    sources: Array.isArray(raw.sources) ? [...raw.sources] : [source],
  };
}

function inferFamily(caip2) {
  if (caip2.startsWith("eip155:")) return "evm";
  if (caip2.startsWith("solana:")) return "solana";
  if (caip2.startsWith("bip122:")) return "bitcoin";
  if (caip2.startsWith("tron:")) return "tron";
  return "unknown";
}

function inferChainId(caip2) {
  if (!caip2.startsWith("eip155:")) return undefined;
  const n = Number(caip2.slice("eip155:".length));
  return Number.isInteger(n) ? n : undefined;
}

function mergePrefer(a, b) {
  // Prefer entry with name longer / more tags / decimals present.
  const score = (x) =>
    (x.name?.length ?? 0) +
    (x.decimals != null ? 5 : 0) +
    (x.icon ? 3 : 0) +
    (x.tags?.length ?? 0);
  const primary = score(a) >= score(b) ? a : b;
  const secondary = primary === a ? b : a;
  return {
    ...secondary,
    ...primary,
    tags: [...new Set([...(a.tags ?? []), ...(b.tags ?? [])])],
    sources: [...new Set([...(a.sources ?? []), ...(b.sources ?? [])])],
  };
}

function main() {
  const catalogChains = readJson("chains/catalog.v1.json");
  const names = chainNameMap(catalogChains);

  const byKey = new Map();

  const ingest = (tokens, source) => {
    for (const raw of tokens) {
      const entry = normalizeEntry(raw, names, source);
      const prev = byKey.get(entry.tokenKey);
      byKey.set(entry.tokenKey, prev ? mergePrefer(prev, entry) : entry);
    }
  };

  ingest(readJson("tokens/natives.v1.json").tokens, "natives");
  ingest(readJson("tokens/stablecoins.v1.json").tokens, "stablecoins");
  ingest(readJson("tokens/bsc.popular.v1.json").tokens, "bsc.popular");
  ingest(readJson("tokens/solana.popular.v1.json").tokens, "solana.popular");

  const all = [...byKey.values()].sort((a, b) => {
    if (a.caip2 !== b.caip2) return a.caip2.localeCompare(b.caip2);
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    return a.tokenKey.localeCompare(b.tokenKey);
  });

  const flat = all.map((t, i) => ({
    sortIndex: i,
    ...t,
  }));

  // Assert unique tokenKey + no bare-symbol identity
  const seen = new Set();
  for (const t of flat) {
    if (seen.has(t.tokenKey)) throw new Error(`duplicate tokenKey ${t.tokenKey}`);
    seen.add(t.tokenKey);
    if (!t.displayHint.includes(t.caip2)) {
      throw new Error(`displayHint must include caip2: ${t.tokenKey}`);
    }
  }

  const updatedAt = new Date().toISOString();
  writeJson("tokens/catalog.v1.json", {
    schema: 1,
    catalogId: "cb-wallet-tokens-catalog-v1",
    updatedAt,
    rule:
      "Primary key is tokenKey (caip2 + asset). Never merge or look up by symbol alone. displayHint always shows chain.",
    tokenCount: flat.length,
    tokens: flat,
  });

  const groups = new Map();
  for (const t of flat) {
    if (!groups.has(t.caip2)) {
      groups.set(t.caip2, {
        caip2: t.caip2,
        chainName: t.chainName,
        family: t.family,
        chainId: t.chainId ?? null,
        tokens: [],
      });
    }
    groups.get(t.caip2).tokens.push(t);
  }

  const chains = [...groups.values()]
    .sort((a, b) => a.caip2.localeCompare(b.caip2))
    .map((g, gi) => ({
      sortIndex: gi,
      caip2: g.caip2,
      chainName: g.chainName,
      family: g.family,
      chainId: g.chainId,
      tokenCount: g.tokens.length,
      tokens: g.tokens.map((t, ti) => ({
        sortIndex: ti,
        tokenKey: t.tokenKey,
        symbol: t.symbol,
        name: t.name,
        address: t.address,
        addressKey: t.addressKey,
        decimals: t.decimals,
        displayHint: t.displayHint,
        icon: t.icon,
        tags: t.tags,
        enabled: t.enabled,
      })),
    }));

  writeJson("tokens/by-chain.v1.json", {
    schema: 1,
    catalogId: "cb-wallet-tokens-by-chain-v1",
    updatedAt,
    rule: "Query tokens by caip2 first. Symbol is not unique across chains.",
    chainCount: chains.length,
    tokenCount: flat.length,
    chains,
  });

  // Human markdown index
  const mdLines = [
    "# Token catalog (queryable)",
    "",
    `Updated: \`${updatedAt}\``,
    "",
    "Primary key: **`tokenKey` = caip2 + asset**. Do **not** treat `USDT` / `USDC` as one asset across chains.",
    "",
    "| Machine JSON | URL |",
    "|---|---|",
    "| Flat catalog | [`catalog.v1.json`](./catalog.v1.json) |",
    "| By chain | [`by-chain.v1.json`](./by-chain.v1.json) |",
    "| Browse UI | [`browse.html`](./browse.html) |",
    "",
    "## Chains",
    "",
  ];
  for (const g of chains) {
    mdLines.push(
      `### ${g.chainName} (\`${g.caip2}\`) — ${g.tokenCount} tokens`,
      "",
      "| symbol | name | address | tokenKey |",
      "|---|---|---|---|",
    );
    for (const t of g.tokens) {
      mdLines.push(
        `| ${t.symbol} | ${t.name} | \`${t.address ?? "native"}\` | \`${t.tokenKey}\` |`,
      );
    }
    mdLines.push("");
  }
  writeFileSync(path.join(root, "tokens/README.md"), `${mdLines.join("\n")}\n`);

  // Update manifest
  const manifest = readJson("manifest.v1.json");
  manifest.publishedAt = updatedAt;
  manifest.files["tokens.catalog"] = {
    path: "tokens/catalog.v1.json",
    sha256: sha256File("tokens/catalog.v1.json"),
  };
  manifest.files["tokens.byChain"] = {
    path: "tokens/by-chain.v1.json",
    sha256: sha256File("tokens/by-chain.v1.json"),
  };
  writeJson("manifest.v1.json", manifest);

  console.log(
    `OK catalog=${flat.length} chains=${chains.length} manifest updated`,
  );
}

main();
