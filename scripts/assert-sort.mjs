#!/usr/bin/env node
/**
 * Fail closed if featured/cbPublished sortIndex !== array index,
 * or caip2/chainKey collide across lists.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function load(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function assertList(name, items) {
  if (!Array.isArray(items)) throw new Error(`${name} must be an array`);
  const keys = new Set();
  const caips = new Set();
  items.forEach((item, i) => {
    if (item.sortIndex !== i) {
      throw new Error(`${name}[${i}].sortIndex=${item.sortIndex}, expected ${i}`);
    }
    if (item.list !== name) {
      throw new Error(`${name}[${i}].list=${item.list}, expected ${name}`);
    }
    if (!item.chainKey || keys.has(item.chainKey)) {
      throw new Error(`${name}[${i}] bad/duplicate chainKey`);
    }
    if (!item.caip2 || caips.has(item.caip2)) {
      throw new Error(`${name}[${i}] bad/duplicate caip2`);
    }
    keys.add(item.chainKey);
    caips.add(item.caip2);
  });
  return { keys, caips };
}

const catalog = load("chains/catalog.v1.json");
const a = assertList("featured", catalog.featured ?? []);
const b = assertList("cbPublished", catalog.cbPublished ?? []);
for (const k of b.keys) {
  if (a.keys.has(k)) throw new Error(`chainKey in both lists: ${k}`);
}
for (const c of b.caips) {
  if (a.caips.has(c)) throw new Error(`caip2 in both lists: ${c}`);
}

const rpc = load("chains/rpc.v1.json");
(rpc.chains ?? []).forEach((row, i) => {
  if (row.sortIndex !== i) {
    throw new Error(`rpc.chains[${i}].sortIndex=${row.sortIndex}, expected ${i}`);
  }
  if (!Array.isArray(row.urls) || row.urls.length === 0) {
    throw new Error(`rpc.chains[${i}] urls empty`);
  }
  for (const u of row.urls) {
    if (typeof u !== "string" || !u.startsWith("https://")) {
      throw new Error(`rpc.chains[${i}] non-https url: ${u}`);
    }
  }
});

console.log("assert-sort: ok");
