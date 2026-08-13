#!/usr/bin/env node
/**
 * Wallet home / one-click chains: each must have ≥1 rpc.v1 URL whose origin is
 * in mo-wallet-app optional-host-permissions.json (matches client fail-closed).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RPC_PATH = path.join(ROOT, "chains/rpc.v1.json");
const CATALOG_PATH = path.join(ROOT, "chains/catalog.v1.json");
const ALLOWLIST_PATH = path.join(
  ROOT,
  "../mo-wallet-app/apps/extension/security/optional-host-permissions.json",
);

function loadAllowlistOrigins() {
  const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
  return new Set([
    ...raw.builtinRpc,
    ...raw.productRpc,
    ...raw.portfolioBalance,
  ]);
}

function originPattern(url) {
  const u = new URL(url);
  if (u.protocol !== "https:") return null;
  return `${u.origin}/*`;
}

function walletLiveCaip2s(catalog) {
  const out = new Set();
  for (const list of ["featured", "cbPublished"]) {
    for (const row of catalog[list] ?? []) {
      if (row.enabled === false) continue;
      if (row.wallet?.livePortfolio === true) out.add(row.caip2);
      if (list === "cbPublished" && row.family === "evm") out.add(row.caip2);
    }
  }
  return out;
}

const allowlist = loadAllowlistOrigins();
const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
const rpc = JSON.parse(readFileSync(RPC_PATH, "utf8"));
const rpcByCaip2 = new Map(
  (rpc.chains ?? []).map((row) => [row.caip2, row.urls ?? []]),
);
const need = walletLiveCaip2s(catalog);
const errors = [];

for (const caip2 of need) {
  const urls = rpcByCaip2.get(caip2) ?? [];
  if (urls.length === 0) {
    errors.push(`${caip2}: missing rpc.v1 row`);
    continue;
  }
  const reviewed = urls.some((url) => {
    const p = originPattern(url);
    return p && allowlist.has(p);
  });
  if (!reviewed) {
    errors.push(
      `${caip2}: no reviewed origin in rpc urls (first=${urls[0] ?? "?"})`,
    );
  }
}

if (errors.length > 0) {
  console.error("validate-wallet-rpc-hosts: FAIL\n" + errors.join("\n"));
  process.exit(1);
}

console.log(
  `validate-wallet-rpc-hosts: OK (${need.size} wallet/cbPublished chains checked)`,
);
