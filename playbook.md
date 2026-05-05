# Bootstrap a new xxx-bee Service

> 從零開新 xxx-bee（custom-bee / customs-bee / erp-bee 等）的完整流程。已驗證在 `custom-bee` 跑通完整 dashboard + login + dev-center 流程（2026-05-05，bee@0.0.1-alpha.12）。

## 前置（一次性）

```bash
gh auth login                                         # 用 GitHub 帳號
gh auth refresh -s read:packages,write:packages       # 加 packages scope
echo 'export NPM_TOKEN=$(gh auth token)' >> ~/.zshrc
source ~/.zshrc
```

## Stage 1：把 bee 裝進來（5 分鐘可動）

```bash
# 建 Next 專案
bunx --bun create-next-app@latest my-bee \
  --typescript --app --no-tailwind --no-src-dir \
  --no-eslint --import-alias "@/*" --use-bun --yes
cd my-bee

# .npmrc（用 placeholder，不寫死 token）
cat > .npmrc <<'EOF'
@heiso-io:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
EOF

# 裝 bee
bun add @heiso-io/bee
```

next.config 加 transpilePackages + nextIntlPlugin：
```ts
// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@heiso-io/bee"],
};

export default withNextIntl(nextConfig);
```

`.env.local` 必要 vars：
```env
DATABASE_URL=postgres://...
AUTH_SECRET=...
TENANT_ID=my-bee-dev
TENANT_PACKAGE=basic
```

驗證：`bun run build` 應該過。

## Stage 2：純函式用法（不用 provider）

直接 import 用：
```tsx
import config from "@heiso-io/bee/config";
import { generateId } from "@heiso-io/bee/lib/id-generator";

export default function Page() {
  return <h1>{config.site.name}</h1>;
}
```

## Stage 3：完整 dashboard（auth + portal + sidebar + dev-center）

要走這條，把 bee 的整套接線複製過來，**menus 跟 routes 必須換成你自己的**。

### 3.1 Tailwind v4

```bash
bun add -d tailwindcss @tailwindcss/postcss tw-animate-css
```

`postcss.config.mjs`：
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

`app/globals.css`（覆蓋 create-next-app 預設）：
```css
@import "@heiso-io/bee/globals.css";
@source "../node_modules/@heiso-io/bee";
```

### 3.2 Sync-assets script

bee 的 logo / favicon 在 package 裡，要複製到 public/。`package.json` 加：
```json
"scripts": {
  "sync-assets": "cp ./node_modules/@heiso-io/bee/public/images/logo.png public/images/logo.png && cp ./node_modules/@heiso-io/bee/public/images/favicon.png public/images/favicon.png",
  "predev": "bun run sync-assets",
  "prebuild": "bun run sync-assets",
  ...
}
```

漏這步會在 login 頁看到 broken logo。

### 3.3 i18n config + 自訂 nav messages

`i18n/request.ts`：
```ts
import { getDashboardMessages as getDashboardCoreMessages } from "@heiso-io/bee/modules/portal/_messages";
import { deepMerge } from "@heiso-io/bee/lib/utils";
import { getUserLocale } from "@heiso-io/bee/server/locale";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  const dashboardCore = await getDashboardCoreMessages(locale);
  const dashboardCustom = (
    await import(`../app/portal/_messages/${locale}.json`)
  ).default;

  return {
    locale,
    messages: {
      components: (await import(`@heiso-io/bee/components/_messages/${locale}.json`)).default,
      auth:       (await import(`@heiso-io/bee/modules/auth/_messages/${locale}.json`)).default,
      account:    (await import(`@heiso-io/bee/modules/account/_messages/${locale}.json`)).default,
      devCenter:  (await import(`@heiso-io/bee/modules/dev-center/_messages/${locale}.json`)).default,
      dashboard:  deepMerge(dashboardCore, dashboardCustom),
    },
  };
});
```

`app/portal/_messages/en.json`（自訂 menu 顯示名）：
```json
{ "nav": { "Home": "Home", "Intro": "Intro" } }
```

> 漏這步 dashboard sidebar 會出現 `MISSING_MESSAGE: Could not resolve 'dashboard.nav.<MenuName>'` 錯誤。每個 `menus.ts` 裡 `title` 字串都要在這 JSON 有對應。

### 3.4 Layout 包 providers

`app/layout.tsx`：
```tsx
export const dynamic = "force-dynamic";

import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import ClientBody from "@heiso-io/bee/providers/ClientBody";
import { getPortalSetting } from "@heiso-io/bee/server/site.service";
import "./globals.css";

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

### 3.5 Auth routes（從 bee re-export）

```bash
mkdir -p app/auth/{login,signup,devlogin,2fa,join,pending,forgot-password,reset-password,change-password,verification/email,login/2steps}
```

每個 `page.tsx` 一行 re-export，例如：
```ts
// app/auth/login/page.tsx
export { default } from "@heiso-io/bee/modules/auth/login/page";

// app/auth/devlogin/page.tsx
export { default } from "@heiso-io/bee/modules/auth/devlogin/page";

// ... 其他類同
```

`app/auth/layout.tsx`：
```ts
export { default } from "@heiso-io/bee/modules/auth/layout";
```

### 3.6 API routes（必要 4 個）

```ts
// app/api/auth/[...nextauth]/route.ts
export * from "@heiso-io/bee/modules/auth/api/auth/route";

// app/api/auth/refresh-membership/route.ts
export * from "@heiso-io/bee/modules/auth/api/refresh-membership/route";

// app/api/account/me/route.ts          ← 漏了 avatar 不顯示
export * from "@heiso-io/bee/modules/auth/api/account/me/route";

// app/api/permissions/me/route.ts      ← 漏了 sidebar 出 500
export * from "@heiso-io/bee/modules/auth/api/permissions/me/route";
```

### 3.7 Proxy（Next 16 middleware,做 auth gate）

`proxy.ts`：
```ts
import { auth } from "@heiso-io/bee/modules/auth/auth.config";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const url = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-current-pathname", req.nextUrl.pathname);

  if (!req.auth) {
    const isPublicPath = ["/auth/", "/api", "/error"].some((p) =>
      url.pathname.startsWith(p),
    );
    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }
  return NextResponse.rewrite(url.clone(), { request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!public|_next/static|_next/image|images|favicon.ico).*)"],
};
```

### 3.8 自訂 menus

`config/menus.ts`（**不要 copy cms-bee 的，會指到不存在的路徑**）：
```ts
export const DASHBOARD_DEFAULT_MENUS = {
  home: {
    group: "functions",
    name: "Home",
    path: "/home",
    icon: "home",
    title: "Home",  // ← i18n 查 dashboard.nav.Home，要在 _messages 裡有對應
    order: 0,
  },
  intro: {
    group: "functions",
    name: "Intro",
    path: "/intro",
    icon: "info",
    title: "Intro",
    order: 1,
  },
};
```

### 3.9 Portal 結構（route group + 各區獨立 layout）

```
app/portal/
├── (main)/                       ← 你的 service routes（共用 layout 套 menus）
│   ├── layout.tsx                ← OrgLayout(menus)
│   ├── home/page.tsx
│   └── intro/page.tsx
├── core/
│   ├── account/                  ← bee account module（re-export from bee）
│   └── dev-center/               ← bee dev-center module（re-export from bee）
├── _messages/                    ← 自訂 nav 翻譯
│   ├── en.json
│   ├── zh-TW.json
│   └── zh-CN.json
└── page.tsx                      ← portal index（auth check + redirect）
```

`app/portal/(main)/layout.tsx`：
```tsx
import OrgLayout from "@heiso-io/bee/modules/portal/(dashboard)/layout";
import { DASHBOARD_DEFAULT_MENUS } from "@/config/menus";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OrgLayout menus={DASHBOARD_DEFAULT_MENUS}>{children}</OrgLayout>;
}
```

⚠️ **不要把 layout 放 `app/portal/layout.tsx`**，會把 `core/dev-center` 雙包導致 layout 衝突。用 route group `(main)/` 隔離。

### 3.10 Portal index（登入後跳第一筆 menu）

`app/portal/page.tsx`（從 cms-bee copy 並把 `@bee/core/` → `@heiso-io/bee/`）：
```tsx
import { ClientRedirect } from "@heiso-io/bee/components/primitives/redirect.client";
import { auth } from "@heiso-io/bee/modules/auth/auth.config";
import { buildDashboardNavigation } from "@heiso-io/bee/modules/portal/(dashboard)/dashboard-config";
import { getMyAllowedMenuIds, getMyMembership } from "@heiso-io/bee/modules/portal/(dashboard)/_server/membership.service";
import { headers } from "next/headers";
import { DASHBOARD_DEFAULT_MENUS as MENUS } from "../../config/menus";

export default async function PortalIndexPage() {
  const session = await auth();
  if (!session?.user) return null;

  const membership = await getMyMembership();
  const fullAccess = membership.dev || membership.role === "owner" || membership.customRole?.fullAccess;
  const allowed = await getMyAllowedMenuIds({ fullAccess, roleId: membership?.roleId });
  const nav = buildDashboardNavigation(allowed, undefined, MENUS);

  const first = nav.items[0];
  const firstPath = Array.isArray(first) ? first[0]?.path : first?.path;
  const pathname = (await headers()).get("x-current-pathname");

  if ((pathname === "/portal" || pathname === "/portal/") && firstPath) {
    return <ClientRedirect url={`/portal${firstPath}`} />;
  }
  return null;
}
```

### 3.11 Dev-center：URL = `/portal/core/dev-center`

bee 內部 hardcoded 連到 `/portal/core/dev-center`,你的 folder 就要 match。

```ts
// app/portal/core/dev-center/layout.tsx
export { default } from "@heiso-io/bee/modules/dev-center/layout";

// app/portal/core/dev-center/page.tsx
export { default } from "@heiso-io/bee/modules/dev-center/page";

// app/portal/core/dev-center/devs/page.tsx
export { default } from "@heiso-io/bee/modules/dev-center/devs/page";

// 其他 sub-route 類同 (portal-setting, (permission)/, (system)/)
```

要看到 dev-center,user 必須是 dev:
- 由 `STAFF_CONFIG.initialStaff`（在 bee 內）的 email 決定
- `pm@heiso.io`、`dev@heiso.io` 預設是 dev
- 透過 `/auth/devlogin` 用這些 email 登入 → session 有 `user.dev: true`

### 3.12 Account routes

```ts
// app/portal/core/account/layout.tsx
export { default } from "@heiso-io/bee/modules/account/layout";

// app/portal/core/account/page.tsx → me/page.tsx 等
// 對照 cms-bee/app/portal/core/account/ 結構抄
```

## Stage 4：Vercel 部署

1. `vercel link --yes --scope <team> --project my-bee`
2. Dashboard / CLI 設 `NPM_TOKEN` env var（GitHub PAT 含 `read:packages`）
3. 用 sync-env pull 拉 env：`bun ../heiso-mac-tools/sync-env/bin/sync-env.ts pull`
4. `git push` → auto deploy

## 升級 bee

```bash
bun add @heiso-io/bee@^x.y.z
bun pm cache rm   # 如果拿不到新版
```

## 常見錯誤

| 錯誤 | 原因 | 解法 |
|---|---|---|
| `bun add` 404 | `.npmrc` scope mapping 沒設 | 補 `@heiso-io:registry=...` |
| `bun add` 401/403 | token 沒 `read:packages` | `gh auth refresh -s read:packages` |
| `bun add` 找不到新版 | bun cache | `bun pm cache rm` |
| build `Unknown module type` | 漏 `transpilePackages` | next.config |
| build `DATABASE_URL is not set` | 沒 `.env.local` | 至少 dummy |
| login 頁 broken logo | 漏 `sync-assets` | 加 script + 跑一次 |
| dev `Could not resolve dashboard.nav.X` | 漏 `_messages` 對應翻譯 | `app/portal/_messages/` 補 key |
| dev `Couldn't find next-intl config` | 沒設 `i18n/request.ts` | Stage 3.3 |
| dev `Cannot read properties of undefined` | bee component 缺 provider | wrap `ClientBody` (3.4) |
| /portal 空白 / 404 | 沒 proxy auth gate | 加 `proxy.ts` (3.7) |
| 登入後跳 `/portal/cms/...` 404 | menus 從 cms-bee copy 沒換 | 改 `config/menus.ts` (3.8) |
| 樣式整個亂 | 沒裝 Tailwind | Stage 3.1 |
| avatar 不見 | 漏 `/api/account/me` route | Stage 3.6 |
| sidebar 500 | 漏 `/api/permissions/me` route | Stage 3.6 |
| dev-center 不見 | user 不是 dev / `STAFF_CONFIG.initialStaff` 沒這個 email | 用 `/auth/devlogin` 登入 |
| dev-center 點進去 404 | folder 名跟 bee URL 不 match | Stage 3.11 用 `dev-center/` 不是 `staff-center/` |
| dev-center 頁面顯示 raw key (`devCenter.dev.title`) | i18n 沒載 devCenter namespace | Stage 3.3 messages 加 `devCenter` |
| `/dev-center/devs` 404 | bee 內 sub-route 是 `devs/`(不是 `staff/`) | 對照 alpha.12+ 的 path |
| route group `(main)` 跟 `core/` 衝突 | 把 layout 放 `/portal/layout.tsx` 雙包 | 用 route group 3.9 |
| 本地過 Vercel 爆 | Vercel 沒 `NPM_TOKEN` env | dashboard 加 |
