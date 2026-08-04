#!/usr/bin/env node
/**
 * Fill / replace chain icons for featured (and known) EVM chains.
 * Source: trustwallet/assets (MIT) via jsDelivr — not third-party wallet CDNs.
 *
 * Usage: node scripts/fetch-featured-chain-icons.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "icons/chains");

/** chainId → trustwallet/assets blockchains/<slug>/info/logo.png */
const TW = {
  1: "ethereum",
  10: "optimism",
  25: "cronos",
  56: "smartchain",
  100: "xdai",
  137: "polygon",
  250: "fantom",
  324: "zksync",
  1088: "metis",
  1101: "polygonzkevm",
  1284: "moonbeam",
  2222: "kava",
  5000: "mantle",
  8453: "base",
  42161: "arbitrum",
  42220: "celo",
  43114: "avalanchec",
  59144: "linea",
  81457: "blast",
  534352: "scroll",
};

function urlsFor(slug) {
  return [
    `https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/${slug}/info/logo.png`,
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${slug}/info/logo.png`,
  ];
}

async function download(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "cb-wallet-static-icons/1.0" },
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
  mkdirSync(outDir, { recursive: true });
  const byHash = new Map();
  const summary = [];

  for (const [idStr, slug] of Object.entries(TW)) {
    const id = Number(idStr);
    const destRel = `icons/chains/eip155-${id}.png`;
    const dest = join(root, destRel);
    let buf = null;
    let used = null;
    for (const u of urlsFor(slug)) {
      try {
        buf = await download(u);
        used = u;
        break;
      } catch (e) {
        console.log(`fail ${id} ${u}: ${e.message}`);
      }
    }
    if (!buf) {
      summary.push({ id, slug, ok: false });
      continue;
    }
    const h = createHash("sha256").update(buf).digest("hex");
    if (byHash.has(h)) {
      console.warn(`duplicate content: eip155-${id} == ${byHash.get(h)} (keeping both paths, same bytes)`);
    } else {
      byHash.set(h, `eip155-${id}.png`);
    }
    writeFileSync(dest, buf);
    console.log(`ok eip155-${id}.png (${buf.length}B) ← ${slug}`);
    summary.push({ id, slug, ok: true, bytes: buf.length, source: used });
  }

  // Point featured catalog icons at png paths we just wrote
  const catalogPath = join(root, "chains/catalog.v1.json");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  for (const listName of ["featured", "cbPublished"]) {
    for (const entry of catalog[listName] || []) {
      const id = entry?.evm?.chainId;
      if (!id) continue;
      const rel = `chains/eip155-${id}.png`;
      if (existsSync(join(root, "icons", rel))) {
        entry.icon = { ...(entry.icon || {}), default: rel };
      }
    }
  }
  catalog.updatedAt = new Date().toISOString();
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

  const manifestPath = join(root, "manifest.v1.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.publishedAt = new Date().toISOString();
    for (const key of Object.keys(manifest.files || {})) {
      const p = manifest.files[key].path;
      if (existsSync(join(root, p))) {
        manifest.files[key].sha256 = sha256File(p);
      }
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  writeFileSync(
    join(root, "sources/CHAIN_ICONS.md"),
    [
      "# Chain icons",
      "",
      "- Featured / known EVM chain logos from [trustwallet/assets](https://github.com/trustwallet/assets) (MIT).",
      "- Filenames are unique by caip2 (`eip155-<chainId>.png`); content-hash dedupe checked at import time.",
      `- Updated: ${new Date().toISOString()}`,
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
