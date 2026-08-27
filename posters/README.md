# Posters

运营海报（行情 / 发现等槽位）。**无数据库**：改 JSON + 换图，merge 进 `main` 后 `static.cb.tools` 生效。

| 需求 | 打开 |
|------|------|
| 机器拉目录 | https://static.cb.tools/posters/catalog.v1.json |
| 当前海报图 | https://static.cb.tools/posters/discover-more-tokens.png |
| manifest 条目 | `posters.catalog` |

## 约定

- 主键是 `id`，不是 title。
- `items[i].sortIndex === i`，客户端禁止重排。
- 图 URL = `imageBase` + `image`。
- `href` 为 `null` 时只展示、不跳转。
- `slots` 标明投放位置（当前仅 `market`，对应 Figma `712:3765`）。
- 设计稿逻辑尺寸 353×125；仓库里的 PNG 是 **@3x**（1059×375）。

## 换图

1. 用同名覆盖 `posters/<id>.png`（或改 `image` 文件名）。
2. 更新 `catalog.v1.json` 的 `updatedAt` / `title` / `href` / `source`。
3. 重算 `manifest.v1.json` 里 `posters.catalog` 的 sha256。
