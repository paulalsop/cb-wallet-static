# DApps

发现页 DApp 专属入口（Figma `712:3689`）。**无数据库**：改 JSON，merge 进 `main` 后 `static.cb.tools` 生效。

| 需求 | 打开 |
|------|------|
| 机器拉目录 | https://static.cb.tools/dapps/catalog.v1.json |
| manifest 条目 | `dapps.catalog` |

当前只上架 **PancakeSwap** 与 **Hyperliquid**。新增条目先改本文件，不要在客户端写死第三家。

## 约定

- 主键是 `id`，不是 name。
- `items[i].sortIndex === i`，客户端禁止重排。
- `url` 必须是该 DApp 的官方 `https` 入口，客户端按此打开内置浏览器，禁止改写成别的站。
- `enabled: false` 或 `status` 不是 `active` 的行，客户端丢弃。
- `featured`：发现页大卡（对照稿 PancakeSwap）。
- `trending`：Trending 宫格。
- `chain`：发现页芯片 `all | nes | eth | bsc | tron`。Hyperliquid 自有 L1，用 `all`，不要硬套 BSC/ETH。
- `color`：字母标底色，`0xAARRGGBB`。

## 上架

1. 在 `items` 追加一行，`sortIndex` 接在末尾。
2. 更新 `itemCount` / `updatedAt`。
3. 重算 `manifest.v1.json` 里 `dapps.catalog` 的 sha256。
