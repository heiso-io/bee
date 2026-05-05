"use client";

import { Toaster } from "@bee/core/components/ui/sonner";
import type { PortalSetting } from "@bee/core/types/system";
import { AccountProvider } from "@bee/core/providers/account";
import { SettingProvider } from "@bee/core/providers/settings";
import { SiteProvider } from "@bee/core/providers/site";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

export default function ClientBody({
  children,
  initialSite,
}: {
  children: React.ReactNode;
  initialSite?: PortalSetting | null;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SettingProvider>
        <SiteProvider initialSite={initialSite}>
          <SessionProvider>
            <AccountProvider>
              {children}
              <Toaster richColors />
            </AccountProvider>
          </SessionProvider>
        </SiteProvider>
      </SettingProvider>
    </ThemeProvider>
  );
}
