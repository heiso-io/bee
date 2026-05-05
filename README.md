# @heiso-io/bee

Shared core for Heiso bee-family services（cms-bee / heiso-hp / erp-bee 等）。

## Quick start

```bash
bun add @heiso-io/bee
```

需在 consumer 的 `next.config.ts` 加：
```ts
transpilePackages: ["@heiso-io/bee"];
```

## 完整 bootstrap 流程

詳見 [`playbook.md`](./playbook.md) — 涵蓋：

- Stage 1：把 bee 裝進來（`.npmrc` / `transpilePackages` / `.env.local`）
- Stage 2：使用 bee 的兩個層級
  - Level A — 純函式 / config（零 provider 依賴）
  - Level B — React component（要 wrap `ClientBody` + `next-intl`）
- Stage 3：完整 dashboard 頁（auth + membership + sidebar）
- Vercel 部署 / 常見錯誤

## 相關

- 架構演進：`evolution.md` / `npm-design.md` 在 [heiso-io/NBEE-doc](https://github.com/heiso-io/NBEE-doc) 的 `arch/` 下
- bee 本體 repo：[heiso-io/bee](https://github.com/heiso-io/bee)
