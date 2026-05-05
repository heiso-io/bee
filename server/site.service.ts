"use server";

import { db } from "@heiso-io/bee/lib/db";
import type { PortalSetting } from "@heiso-io/bee/types/system";

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
