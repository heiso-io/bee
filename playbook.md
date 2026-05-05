# Bootstrap a new xxx-bee Service

> 從零開新 xxx-bee（custom-bee / customs-bee / erp-bee 等）的標準流程。已驗證在 `custom-bee` 跑通（2026-05-05，bee@0.0.1-alpha.6）。

## 前置

- `gh` CLI 已登入並含 `read:packages` scope:
  ```bash
  gh auth refresh -s read:packages,write:packages
  ```
- 本機 shell 設好 `NPM_TOKEN`:
  ```bash
  echo 'export NPM_TOKEN=$(gh auth token)' >> ~/.zshrc && source ~/.zshrc
  ```

## Stage 1：把 bee 裝進來

1. **建 Next 專案**
   ```bash
   bunx --bun create-next-app@latest my-bee \
     --typescript --app --no-tailwind --no-src-dir \
     --no-eslint --import-alias "@/*" --use-bun --yes
   cd my-bee
   ```

2. **設 `.npmrc`**
   ```bash
   cat > .npmrc <<'EOF'
   @heiso-io:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   EOF
   ```

3. **裝 bee**
   ```bash
   bun add @heiso-io/bee
   ```

4. **Next config 加 transpilePackages**（**必要**，bee 是純 TS source）
   ```ts
   // next.config.ts
   const nextConfig: NextConfig = {
     transpilePackages: ["@heiso-io/bee"],
   };
   ```

5. **設 `.env.local`**（最少這幾個 var，bee 在 server-side eval 時會讀）
   ```env
   DATABASE_URL=postgres://...
   AUTH_SECRET=...
   TENANT_ID=my-bee-dev
   TENANT_PACKAGE=basic
   ```

驗證：`bun run build` 應該過。

## Stage 2：使用 bee 的兩個層級

bee 提供的東西分兩層，**啟動成本完全不同**：

### Level A：純函式 / config（零 provider 依賴）

可直接用，不需設定任何 provider：

- `@heiso-io/bee/config` — 站點預設值
- `@heiso-io/bee/lib/id-generator` — `generateId()` 等
- `@heiso-io/bee/lib/url` — `slugify()` 等
- `@heiso-io/bee/types/*` — 型別

```tsx
// app/portal/page.tsx
import config from "@heiso-io/bee/config";
import { generateId } from "@heiso-io/bee/lib/id-generator";

export default function PortalPage() {
  return (
    <main>
      <h1>{config.site.name}</h1>
      <p>id: {generateId()}</p>
    </main>
  );
}
```

✅ 這層 `bun run dev` 就能直接跑。

### Level B：React component / hook（需要 provider stack）

用 bee 的 `<Logo>`、`<Layout>`、`<Sidebar>`、`<Header>`、`useSite()`、`useAccount()` 等就是 Level B。它們假設以下 provider 已 wrap：

| Provider | 提供什麼 | 從哪來 |
|---|---|---|
| `ThemeProvider` (next-themes) | dark / light mode | `ClientBody` 內含 |
| `SessionProvider` (next-auth) | 登入 session | `ClientBody` 內含 |
| `SiteProvider` | 站點 branding（給 `useSite`） | `ClientBody` 內含 |
| `AccountProvider` | 當前 user account | `ClientBody` 內含 |
| `SettingProvider` | 系統設定 | `ClientBody` 內含 |
| `NextIntlClientProvider` | i18n | 自己 wrap |
| `Toaster` | sonner toast | `ClientBody` 內含 |

bee 把上面 5 個包成 `ClientBody`，但你 layout 仍要自己 wrap：

```tsx
// app/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import ClientBody from "@heiso-io/bee/providers/ClientBody";
import { getPortalSetting } from "@heiso-io/bee/server/site.service";

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const initialSite = await getPortalSetting().catch(() => null);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale}>
          <ClientBody initialSite={initialSite}>{children}</ClientBody>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**還需要**：
- `i18n/request.ts`（next-intl 必要 config，照 cms-bee 抄）
- DB 內有 `settings` 表（`getPortalSetting` 會查）；沒有就 `initialSite` 是 `null`
- DB 內有 `account` / `membership` 表，否則 `useAccount` / `useSite` 拿到 null

## Stage 3：完整的 dashboard 頁（auth + membership + sidebar）

要做 cms-bee 那種 `/portal/dashboard` 風格，再加：

1. **Auth 設定**：`bee/modules/auth/auth.config` 已有，但你要決定 provider（OAuth / password / 2FA）
2. **DB schema**：bee 有 drizzle schema 在 `lib/db/schema/`，跑 `bun x drizzle-kit push` 把表建到你的 DB
3. **Custom menus config**：`config/menus.ts` 定義 dashboard 側欄要顯示什麼
4. **`heiso.config.json`**：sync-env 用
   ```json
   {
     "service": "my-bee",
     "envFile": ".env.local",
     "protectedPatterns": ["^VERCEL$", "^VERCEL_"]
   }
   ```
5. **Vercel link + sync env**：
   ```bash
   vercel link
   bun ../heiso-mac-tools/sync-env/bin/sync-env.ts pull
   ```

完整對照可看 [cms-bee](https://github.com/heiso-io/cms-bee) 怎麼接。

## Vercel 部署

1. Vercel 設 `NPM_TOKEN` env var（`vercel env add NPM_TOKEN production`，貼 PAT 含 `read:packages`）
2. `git push` → Vercel auto deploy

## 升級 bee

```bash
bun add @heiso-io/bee@^x.y.z
```

semver caret 鎖大版本。

## 常見錯誤

| 錯誤 | 原因 | 解法 |
|---|---|---|
| `bun add` 404 | `.npmrc` 沒 scope mapping | 補 `@heiso-io:registry=...` |
| `bun add` 401/403 | token 沒 `read:packages` | `gh auth refresh -s read:packages` |
| `bun add` 找不到新版本 | bun cache 過期 | `bun pm cache rm` |
| build `Unknown module type` | 漏 `transpilePackages` | next.config 加 |
| build `Module not found` (bee 內) | bee version 太舊 | 升到 alpha.6+ |
| build `DATABASE_URL is not set` | 沒 `.env.local` | 至少 dummy env |
| dev 500 `Cannot read properties of undefined` | bee component 缺 provider | wrap `ClientBody`（Stage 2 Level B） |
| dev 500 `Couldn't find next-intl config` | 沒設 `i18n/request.ts` | 從 cms-bee copy |
| 本地過、Vercel 爆 | Vercel 沒 `NPM_TOKEN` | dashboard 加 |
