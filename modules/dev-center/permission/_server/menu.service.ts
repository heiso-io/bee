"use server";

import { db } from "@bee/core/lib/db";

async function getMenus() {
  const result = await db.query.menus.findMany({
    where: (t, { isNull }) => isNull(t.deletedAt),
    orderBy: (t, { asc }) => [asc(t.sortOrder)],
  });

  return result;
}

export { getMenus };
