"use server";

import { db } from "@bee/core/lib/db";
import type { PortalSetting } from "@bee/core/types/system";

export async function getPortalSetting(): Promise<PortalSetting> {
  const settings = await db.query.settings.findMany({
    where: (fields, { and, eq, isNull }) => and(
      isNull(fields.deletedAt),
      eq(fields.group, 'site'),
    ),
  });

  const result: Record<string, unknown> = {};
  for (const { name, value } of settings) {
    result[name] = value;
  }
  return result as unknown as PortalSetting;
}
