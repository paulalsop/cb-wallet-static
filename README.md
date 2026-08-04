# cb-wallet-static

cb.wallet 远端只读配置仓（链目录 / RPC / 图标）。**无数据库**：Git 即存储。

## 结构

- `manifest.v1.json` — 总索引 + 文件 sha256
- `chains/catalog.v1.json` — **双列表**：`featured[]`（精选）+ `cbPublished[]`（cb 一键发公链）
- `chains/public-evm.v1.json` — 公开 EVM 网络导入池（未进精选，可晋升）
- `chains/rpc.v1.json` — 每链 `urls[]`，`urls[0]` 为主用
- `icons/chains/` — 链图标；`icons/tokens/` — 稀疏代币图标
- `tokens/stablecoins.v1.json` — **按链区分的稳定币**（主键 `caip2+地址`，禁止只按 USDT/USDC 符号）
- `icons/tokens/eip155-<chainId>/<address>.png` — 稳定币图标路径含链 ID，链间不冲突
- `sources/` — 导入来源与归因（见 `ATTRIBUTION.md`）
- `bridges/network-bridge.v1.json` — 桥发现层

规范见 monorepo：`mo-wallet-app/docs/0721update/wallet-static-config-git-hosting.md`

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

1. 推送 `main`
2. 仓 Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`（无需 Actions；当前 PAT 无 workflow 权限）
3. 打开：`https://paulalsop.github.io/cb-wallet-static/manifest.v1.json`
4. 若绑自定义域名，改 `manifest.iconBase` 与 `CNAME` 后重算 sha 再提交

## 管理后台写仓权限

Fine-grained PAT：仅本仓，**Contents: Read and write** + Metadata Read。Token 放服务器 Secret，勿进前端。
