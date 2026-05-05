import { cache } from "react";
import { getSystemSettings } from "@bee/core/server/services/system/setting";
import { getPortalSetting } from "@bee/core/server/site.service";
import type { Settings } from "@bee/core/types/system";

/**
 * settings()：從 DB system settings 讀，加上 secret env 覆蓋。
 *
 * 注意：AWS / S3 / CDN 等部署值不再走這裡（由 next.config.ts 注入 process.env，
 * lib/s3 直接讀），此處只處理 DB-driven 與 server-only secrets。
 */
export const settings = cache(async (withoutKey: boolean = false): Promise<Settings> => {
  const data = await getSystemSettings(withoutKey);
  if (process.env.NOTIFY_EMAIL) {
    data["NOTIFY_EMAIL"] = process.env.NOTIFY_EMAIL;
  }
  // RESEND_API_KEY 已改走 dev-center/key 模組（getKey）
  return data;
});

export const site = cache((): Promise<Settings> => {
  return getPortalSetting() as unknown as Promise<Settings>;
});
