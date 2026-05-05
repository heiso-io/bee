"use server";

import { db } from "@bee/core/lib/db";

async function getRoles() {
  const result = await db.query.roles.findMany({
    columns: {
      id: true,
      name: true,
    },
    where: (t, { isNull }) => isNull(t.deletedAt),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  return result;
}

export { getRoles };
