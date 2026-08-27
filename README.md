# cb-wallet-static

cb.wallet 远端只读配置仓（链目录 / RPC / **代币目录** / 图标）。**无数据库**：Git 即存储。

公开入口：[https://static.cb.tools/](https://static.cb.tools/)

## Git 规则（强制）

`main` 受 GitHub 分支保护：**禁止直推**（含仓库管理员、Cursor「同步更改」）。  
`main` 一合进就会走 GitHub Pages，线上 `https://static.cb.tools` 跟着变，手机 / 扩展下拉才会吃到新 catalog。

1. 从最新 `main` 拉功能分支（例如 `feat/…`、`chore/…`），**只推这个分支**。
2. 开 Pull Request → `main`；至少 **1 个 approving review**。
3. 在 GitHub 上 **Merge**。不要 `git push origin main`，不要点「同步更改 1个」。
4. 合并后本地：`git checkout main && git pull`。
5. 验收：`https://static.cb.tools/manifest.v1.json` 的 `publishedAt` / sha256 已更新。客户端要完全重启再下拉，热重载不够。

本仓与 `mo-wallet-app` 独立，改动不写 `walletdocs/`。钱包运行时只打 `static.cb.tools`，不读你电脑上的这份目录。

## 结构

- `manifest.v1.json` — 总索引 + 文件 sha256
- `chains/catalog.v1.json` — **双列表**：`featured[]`（精选）+ `cbPublished[]`（cb 一键发公链）
- `chains/public-evm.v1.json` — 公开 EVM 网络导入池（未进精选，可晋升）
- `chains/rpc.v1.json` — 每链 `urls[]`，`urls[0]` 为主用；**钱包客户端直接读此文件**（无全链 RPC 网关）
- `chains/catalog.v1.json` 每条链可选 **`wallet`** 块 — 首页/live/swap/market/UI 等产品字段（见下）
- **`tokens/catalog.v1.json`** — **精选代币扁平表**（含 symbol / name / caip2 / chainName / address / tokenKey）
- **`tokens/by-chain.v1.json`** — **按链分组**（先选链，再列该链代币）
- **`tokens/browse.html`** — 浏览器可搜索的代币表（[打开](https://static.cb.tools/tokens/browse.html)）
- `tokens/stablecoins.v1.json` / `*.popular.v1.json` / `natives.v1.json` — 生成 catalog 的源表
- `tokens/*.partial.v1.json` — **仅图标清单**（无完整 name，不进精选 catalog）
- `icons/chains/` · `icons/tokens/` — 图标
- `sources/` — 导入来源与归因（见 `ATTRIBUTION.md`）
- `bridges/network-bridge.v1.json` — 桥发现层
- `risk/hints.v1.json` — **自有风控提示**（origin / address / token / rpc；禁止第三方钱包名单）

规范见 monorepo：`mo-wallet-app/docs/0721update/wallet-static-config-git-hosting.md`

## 钱包 RPC（`chains/rpc.v1.json`）

- Extension **不**内置 per-chain RPC；SW/Popup 从 CDN 快照读 `rpc.v1`，按 `caip2` 匹配 `urls[]`。
- 只有 URL 的 **origin** 已在 extension 安装包 `optional-host-permissions.json` 里审查过的链，才会 `livePortfolio`（否则 fail-closed 仅展示）。
- 新增 RPC host：先在 `mo-wallet-app/apps/extension/security/optional-host-permissions.json` 加 origin 并发版 extension，再在 `rpc.v1` 里配置 URL。
- `urls` 顺序即客户端 fallback 顺序；优先放稳定、已在 manifest 的节点。

## 钱包链产品字段（`catalog.v1.json` → `wallet`）

首页是否展示、排序、swap、行情对等**全部在此配置**，extension `seed` 仅保留 family/slip44 安全根：

```json
"wallet": {
  "livePortfolio": true,
  "deriveFromEvmAddress": true,
  "switchableEvm": true,
  "market": { "binancePair": "BNBUSDT", "coingeckoId": "binancecoin" },
  "ui": { "colorBg": "0xF0B90B", "badgeColor": "0xF0B90B", "mark": "B", "homeSort": 2 },
  "swap": { "dexKind": "univ2", "router": "0x10ED...", "wrappedNative": "0xbb4..." },
  "aliases": ["tron:mainnet"]
}
```

本地校验 RPC host（需在 monorepo 根目录，能读到 `mo-wallet-app`）：

```bash
node scripts/validate-wallet-rpc-hosts.mjs
```

## 代币怎么查（必读）

| 需求 | 打开 |
|------|------|
| 人眼浏览 / 搜索 | https://static.cb.tools/tokens/browse.html |
| 机器拉全表 | https://static.cb.tools/tokens/catalog.v1.json |
| 机器按链查 | https://static.cb.tools/tokens/by-chain.v1.json |
| Markdown 索引 | https://static.cb.tools/tokens/README.md |

**主键是 `tokenKey`（`caip2` + 资产），不是 symbol。**  
同名 `USDT` 在 ETH / BSC / TRON 是不同行，`displayHint` 固定带链，例如 `USDT · eip155:56`。

重建精选目录：

```bash
# 从公开 token list 扩量（每链默认 60，含名称/合约/链）
node scripts/import-public-tokenlists.mjs --limit 60
# 汇总可查询 catalog + by-chain + browse 数据
node scripts/build-token-catalog.mjs
```

说明：`*.partial.v1.json` 只有图标路径、**没有 name**，不会直接进 browse；要上架必须有 `tokenKey / symbol / name / caip2`。

## 从公开 networklist 导入

**不能**对第三方 App 抓包。公开链/RPC 来自社区仓库 `chains.json`，转换成本仓 schema：

```bash
node scripts/import-public-evm-networklist.mjs
node scripts/assert-sort.mjs
# 代币图标（稀疏，默认每链 80 个；全量过大且版权需自审）
node scripts/import-token-icons.mjs --chains eth,bsc,bitcoin,tron,solana --limit 40
# 稳定币：按链+合约区分（必跑）
node scripts/fetch-stablecoin-icons.mjs
# Solana + BSC 精选链 / RPC / 热门代币补全
node scripts/complete-solana-bsc.mjs
# 汇总可查询 catalog
node scripts/build-token-catalog.mjs
```

生产上线前请替换未授权图标，并确保产品 UI **不出现**第三方钱包品牌字样。

精选链正式图标（推荐）：

```bash
node scripts/fetch-featured-chain-icons.mjs
```

来源为 `trustwallet/assets`（MIT），文件名按 `eip155-<chainId>.png` 唯一，不会互相覆盖。

## 排序（强制）

每个列表内 `item[i].sortIndex === i`。客户端禁止重排。

本地校验：

```bash
node scripts/assert-sort.mjs
```

## 发布到 GitHub Pages

1. 按上文 **Git 规则**：功能分支 PR **merge 进 `main`**（不能直推）
2. 仓 Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`（无需 Actions；当前 PAT 无 workflow 权限）
3. 打开：`https://paulalsop.github.io/cb-wallet-static/manifest.v1.json`
4. 自定义域名：`static.cb.tools`
   - **Cloudflare DNS**（域名在 CF）：添加 CNAME `static` → `paulalsop.github.io`（建议先 **仅 DNS / 灰云**，证书签发后再按需开代理）
   - **GitHub Pages**：Custom domain 填 `static.cb.tools`，勾选 Enforce HTTPS
   - 验收：`https://static.cb.tools/manifest.v1.json`
5. 若换域名，改 `manifest.iconBase` 与根目录 `CNAME` 后重算相关引用再提交

> 选用 `static.cb.tools` 而非 apex：`cb.tools` / `wallet.cb.tools` 留给平台与钱包深链，避免冲突。

## 管理后台写仓权限

Fine-grained PAT：仅本仓，**Contents: Read and write** + Metadata Read。Token 放服务器 Secret，勿进前端。
