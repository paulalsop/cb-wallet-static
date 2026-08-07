/**
 * Refresh market/prices.v1.json from OKX (per-symbol ticker) and update manifest.
 *
 * Run: node scripts/build-market-prices.mjs
 * Schedule via GitHub Action (e.g. every 10–15 min) so wallet clients only hit static.cb.tools.
 *
 * Schema:
 *   { schema: 1, fetchedAt, bySymbol: { BTC: { priceUsd, changePct24h } }, byAssetId?: {} }
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Home / registry natives + aggregated stables — keep in sync with extension market-prices. */
const SYMBOLS = [
  { symbol: "BTC", instId: "BTC-USDT" },
  { symbol: "ETH", instId: "ETH-USDT" },
  { symbol: "BNB", instId: "BNB-USDT" },
  { symbol: "TRX", instId: "TRX-USDT" },
  { symbol: "SOL", instId: "SOL-USDT" },
  { symbol: "DOT", instId: "DOT-USDT" },
  { symbol: "POL", instId: "POL-USDT" },
  { symbol: "USDT", instId: "USDT-USD" },
  { symbol: "USDC", instId: "USDC-USDT" },
  // DAI: no OKX spot — filled via CoinGecko below.
];

const COINGECKO_FALLBACK = {
  DAI: "dai",
};

function writeJson(rel, value) {
  writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
}

function sha256File(rel) {
  return createHash("sha256")
    .update(readFileSync(path.join(root, rel)))
    .digest("hex");
}

function asNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function fetchOkxTicker(instId) {
  const url = `https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OKX ${instId} HTTP ${res.status}`);
  const json = await res.json();
  if (String(json.code) !== "0" || !Array.isArray(json.data) || !json.data[0]) {
    throw new Error(`OKX ${instId} bad body`);
  }
  return json.data[0];
}

async function fetchCoingeckoMarkets(ids) {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("price_change_percentage", "24h");
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("CoinGecko bad body");
  return json;
}

async function main() {
  const bySymbol = {};
  const errors = [];
  await Promise.all(
    SYMBOLS.map(async ({ symbol, instId }) => {
      try {
        const row = await fetchOkxTicker(instId);
        const price = asNumber(row.last);
        const open = asNumber(row.open24h);
        if (price === null || price <= 0) {
          errors.push(`${symbol}: invalid price`);
          return;
        }
        bySymbol[symbol] = {
          priceUsd: price,
          changePct24h:
            open !== null && open > 0 ? ((price - open) / open) * 100 : 0,
        };
      } catch (e) {
        errors.push(`${symbol}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );

  const needCg = Object.entries(COINGECKO_FALLBACK).filter(
    ([sym]) => !bySymbol[sym],
  );
  if (needCg.length > 0) {
    try {
      const rows = await fetchCoingeckoMarkets(needCg.map(([, id]) => id));
      const byId = new Map(rows.map((r) => [r.id, r]));
      for (const [symbol, id] of needCg) {
        const row = byId.get(id);
        const price = asNumber(row?.current_price);
        if (price === null || price <= 0) {
          errors.push(`${symbol}: CoinGecko invalid price`);
          continue;
        }
        bySymbol[symbol] = {
          priceUsd: price,
          changePct24h: asNumber(row?.price_change_percentage_24h) ?? 0,
        };
      }
    } catch (e) {
      errors.push(
        `coingecko: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (Object.keys(bySymbol).length === 0) {
    console.error("build-market-prices: no quotes", errors);
    process.exit(1);
  }

  mkdirSync(path.join(root, "market"), { recursive: true });
  const envelope = {
    schema: 1,
    fetchedAt: new Date().toISOString(),
    source: "okx",
    bySymbol,
    byAssetId: {},
  };
  writeJson("market/prices.v1.json", envelope);

  const manifest = JSON.parse(
    readFileSync(path.join(root, "manifest.v1.json"), "utf8"),
  );
  manifest.publishedAt = envelope.fetchedAt;
  manifest.files = manifest.files ?? {};
  manifest.files["market.prices"] = {
    path: "market/prices.v1.json",
    sha256: sha256File("market/prices.v1.json"),
  };
  writeJson("manifest.v1.json", manifest);

  console.log(
    `wrote market/prices.v1.json (${Object.keys(bySymbol).length} symbols)`,
  );
  if (errors.length) console.warn("partial failures:", errors.join("; "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
