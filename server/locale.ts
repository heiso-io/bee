"use server";

import { defaultLocale, type Locale } from "@heiso-io/bee/i18n/config";
import { getSystemSettings } from "@heiso-io/bee/server/services/system/setting";
import { cookies } from "next/headers";

const COOKIE_NAME = "_LOCALE";

export async function getUserLocale() {
  const cookieList = await cookies();
  const fromCookie = cookieList.get(COOKIE_NAME)?.value as Locale | undefined;
  if (fromCookie) return fromCookie;

  try {
    const system = await getSystemSettings();
    const configured = (system?.language as any)?.default as Locale | undefined;
    return (configured || defaultLocale) as Locale;
  } catch {
    return defaultLocale;
  }
}

export async function setUserLocale(locale: Locale) {
  const cookieList = await cookies();
  cookieList.set(COOKIE_NAME, locale);
}
