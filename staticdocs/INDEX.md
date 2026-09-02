# staticdocs 索引

cb.wallet 静态 CDN 配置仓（`cb-wallet-static` → `https://static.cb.tools`）的**开发记忆点**。按日期倒序，每天一行；当天再次改动只更新该行概述，不新增行。

## 规则与必读

- 改动前强制流程见 `RULES.md`（镜像 `.cursor/rules/staticdocs-memory.mdc`，工作区另有一份 `mofitwork/.cursor/rules/staticdocs-memory.mdc`）。
- 本仓**只读配置、Git 即存储、无数据库**；`main` 合入即上线 GitHub Pages。目录 JSON 的 schema/主键/排序/发布约定以各目录 `README.md` 与仓库根 `README.md` 为准。
- 跨仓上下文：客户端消费侧记忆见 `mo-wallet-app/walletdocs/`（尤其 8/25「目录只认 CDN」→ 8/28「DApp 目录/圆标拉 CDN」一段）；权威托管规范见 `mo-wallet-app/docs/0721update/wallet-static-config-git-hosting.md` 与 `cdn-registry-audit-2026-08-13.md`。

## 上线链路速查（客户端视角）

| 文件 | 用途 | 消费者 |
|---|---|---|
| `manifest.v1.json` | 总索引 + 每文件 sha256 + `publishedAt` + `iconBase`/`posterBase` | 客户端先拉 manifest 校验 |
| `chains/catalog.v1.json` | `featured[]`（26，其中 13 带 `wallet{}` 产品字段）+ `cbPublished[]`（空） | 链列表 / 首页排序 / live / swap / 行情对 |
| `chains/rpc.v1.json` | 每链 `urls[]`（2156 条；`urls[0]` 主用） | 钱包 RPC（无全链网关） |
| `chains/public-evm.v1.json` | 公开 EVM 导入池（2131，未进精选可晋升） | 添加自定义网导入池 |
| `tokens/catalog.v1.json` / `by-chain.v1.json` | 精选代币扁平表 / 按链分组（主键 `tokenKey` = caip2+资产） | 代币列表 / 搜索 / 详情 |
| `tokens/stablecoins.v1.json` 等 | 生成 catalog 的源表（`*.popular.v1.json` / `natives.v1.json` / `*.partial.v1.json`） | 只给 build 脚本 |
| `icons/chains/` `icons/tokens/` `icons/dapps/` | 链 / 代币 / DApp 图标（`iconBase` 前缀） | 图标展示 |
| `market/prices.v1.json` | OKX 快照 `bySymbol{priceUsd, changePct24h}` | 行情页 |
| `risk/hints.v1.json` | 自有风控提示（只降信任；CDN miss 客户端 `allowStale`） | 风控拦截/警示 |
| `bridges/network-bridge.v1.json` | 桥发现层（仅 discovery、绝不持钥） | 桥入口 |
| `posters/catalog.v1.json` + `posters/*.png` | 运营海报目录（`posterBase`） | 行情/发现页槽位 |
| `dapps/catalog.v1.json` + `icons/dapps/*.png` | 发现页 DApp 专属入口（当前 PancakeSwap / Hyperliquid） | 发现页 DApp 宫格 |

## 记忆点

| 日期 | 当日主题概述 | 文件 |
|---|---|---|
| 2026-08-28 | DApp 专属目录（PancakeSwap / Hyperliquid）上架 + 圆标 PNG（`icons/dapps/`）；manifest 增 `dapps.catalog` | [2026-08-28.md](./2026-08-28.md) |
| 2026-08-27 | 稳定币目录修正：TRON USDT 改官方合约、Base 补 USDT、Avalanche C 补 DAI、SOL 行核对（22→27）；README 立「Git 规则（强制）」段；posters 海报目录 + manifest `posterBase` | [2026-08-27.md](./2026-08-27.md) |
| 2026-08-25 | BSC Chapel（eip155:97）+ Solana Devnet 进 featured（24→26）并配 wallet 字段；主流 EVM RPC fallback 换血（去 ankr/mycryptoapi，统一 publicnode/drpc/1rpc.io） | [2026-08-25.md](./2026-08-25.md) |
| 2026-08-13 | 钱包产品字段上架：11 条链加 `wallet{}`、晋升 BTC/TRON/Polkadot 进 featured（21→24）、`validate-wallet-rpc-hosts.mjs`（8/26 合 main） | [2026-08-13.md](./2026-08-13.md) |
| 2026-08-07 | market 快照刷新 + 稳定币/DAI（OKX 无现货走 CoinGecko 兜底）；risk/hints 自有风控目录（首版仅 canary `.invalid`） | [2026-08-07.md](./2026-08-07.md) |
| 2026-08-06 | 可查询代币目录（catalog/by-chain/browse.html，主键 tokenKey）；公开 token list 扩量 ~425+；ETH 原生图标修正；域名切 `static.cb.tools`；market/prices 上线 + 当日两次快照 | [2026-08-06.md](./2026-08-06.md) |
| 2026-08-05 | Pages 自定义域名 `static.mo.fit`（次日弃用改 cb.tools） | [2026-08-05.md](./2026-08-05.md) |
| 2026-08-04 | 建仓首发：curated 链目录/RPC/图标/token 源表 + manifest schema1 + 导入脚本（featured 21） | [2026-08-04.md](./2026-08-04.md) |
