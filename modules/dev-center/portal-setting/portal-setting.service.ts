"use server";

import type { Locale } from "@bee/core/i18n/config";
import { db } from "@bee/core/lib/db";
import { settings } from "@bee/core/lib/db/schema";
import type { Settings } from "@bee/core/types/system";

async function getGeneralSettings(): Promise<Settings> {
  const result = await db.query.settings.findMany({
    columns: { name: true, value: true },
    where: (fields, { and, eq, isNull }) =>
      and(eq(fields.group, "system"), isNull(fields.deletedAt)),
  });

  const settingsMap: Record<string, unknown> = {};
  for (const { name, value } of result) {
    settingsMap[name] = value;
  }
  return settingsMap;
}

async function saveGeneralSetting(data: Settings) {

  await db.transaction(async (tx) => {
    const entries = Object.entries(data ?? {});
    if (entries.length === 0) return;
    await Promise.all(
      entries.map(async ([key, value]) => {
        await tx
          .insert(settings)
          .values({
            name: key,
            value,
            group: "system",
          })
          .onConflictDoUpdate({
            target: settings.name,
            set: {
              value,
              updatedAt: new Date(),
            },
          });
      }),
    );
  });
}

async function saveDefaultLanguage(locale: Locale) {

  await db
    .insert(settings)
    .values({
      name: "language",
      value: { default: locale },
      group: "system",
    })
    .onConflictDoUpdate({
      target: settings.name,
      set: {
        value: { default: locale },
        updatedAt: new Date(),
      },
    });
}

export { getGeneralSettings, saveGeneralSetting, saveDefaultLanguage };
