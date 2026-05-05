"use server";

import { db } from "@bee/core/lib/db";
import type { Settings } from "@bee/core/types/system";

export async function getSystemSettings(
  withoutKey: boolean = false,
): Promise<Settings> {
  const rows = await db.query.settings.findMany({
    columns: { name: true, value: true },
    where: (fields, { and, eq, isNull }) =>
      and(
        eq(fields.group, "system"),
        withoutKey ? eq(fields.isKey, false) : undefined,
        isNull(fields.deletedAt),
      ),
  });
  const result: Record<string, unknown> = {};
  for (const { name, value } of rows) {
    result[name] = value;
  }
  return result;
}
