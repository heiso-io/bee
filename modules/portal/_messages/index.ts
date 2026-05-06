import type { Locale } from "@heiso-io/bee/i18n/config";

export async function getDashboardMessages(locale: Locale) {
  const dashboard = (await import(`../(dashboard)/_messages/${locale}.json`))
    .default;

  const permission = (
    await import(`../../permission/_messages/${locale}.json`)
  ).default;

  return {
    ...dashboard,
    permission,
  };
}
