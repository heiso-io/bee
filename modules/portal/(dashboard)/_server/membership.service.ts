"use server";

import { cache } from "react";
import { db } from "@heiso-io/bee/lib/db";
import type { TPermission } from "@heiso-io/bee/lib/db/schema";
import { roleMenus } from "@heiso-io/bee/lib/db/schema";
import { auth } from "@heiso-io/bee/modules/auth/auth.config";
import { eq, and } from "drizzle-orm";

// Types
type AccessParams = {
  fullAccess: boolean;
  roleId?: string | null;
};

// Error messages
const UNAUTHORIZED_ERROR = "Unauthorized";

/**
 * 取得當前帳號資訊
 */
async function getAccount() {
  const session = await auth();
  const accountId = session?.user?.id;
  if (!accountId) throw new Error(UNAUTHORIZED_ERROR);


  const account = await db.query.accounts.findFirst({
    columns: {
      id: true,
      email: true,
      name: true,
    },
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });
  return account ?? null;
}

/**
 * 取得當前帳號的成員資格
 * 統一使用 accounts 表
 */
const getMyMembership = cache(async () => {
  const t0 = performance.now();
  const session = await auth();
  const accountId = session?.user?.id;
  if (!accountId) throw new Error(UNAUTHORIZED_ERROR);

  const kind: "dev" | "member" = (session?.user?.kind ?? "member") as "dev" | "member";

  const tDb = performance.now();
  const account = await db.query.accounts.findFirst({
    columns: {
      id: true,
      roleId: true,
      role: true,
      status: true,
    },
    with: {
      customRole: {
        columns: {
          id: true,
          fullAccess: true,
        },
      },
    },
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });

  const tEnd = performance.now();
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[perf] getMyMembership total=${(tEnd - t0).toFixed(0)}ms (auth=${(tDb - t0).toFixed(0)}ms db=${(tEnd - tDb).toFixed(0)}ms)`,
    );
  }

  // Optional dev throttle for testing loading states / Suspense fallbacks.
  if (process.env.DEV_DELAY) {
    await new Promise((r) => setTimeout(r, Number(process.env.DEV_DELAY)));
  }

  return {
    kind,
    id: account?.id,
    accountId: account?.id,
    roleId: account?.roleId,
    role: account?.role,
    status: account?.status,
    customRole: account?.customRole,
  };
});

/**
 * Returns allowed menu IDs for the current user.
 * - If fullAccess is true, returns null (indicating all menus are allowed)
 * - Otherwise, returns an array of menu IDs from role_menus table
 */
async function getMyAllowedMenuIds({
  fullAccess,
  roleId,
}: AccessParams): Promise<string[] | null> {
  // Full access means all menus are allowed
  if (fullAccess) {
    return null;
  }

  if (!roleId) {
    return [];
  }


  // Query role_menus to get allowed menu IDs
  const roleMenusData = await db
    .select({
      menuId: roleMenus.menuId,
    })
    .from(roleMenus)
    .where(eq(roleMenus.roleId, roleId));

  const menuIds = roleMenusData.map((item) => item.menuId);
  return menuIds;
}

/**
 * 取得組織權限
 */
async function getMyOrgPermissions({
  fullAccess,
  roleId,
}: AccessParams): Promise<Pick<TPermission, "resource" | "action">[]> {
  if (!roleId) return [];


  if (fullAccess) {
    return db.query.permissions.findMany({
      columns: {
        resource: true,
        action: true,
      },
      where: (t, { isNull }) => isNull(t.deletedAt),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
  }

  const rolePermissionsResult = await db.query.rolePermissions.findMany({
    with: {
      permission: {
        columns: {
          resource: true,
          action: true,
        },
      },
    },
    where: (t, { eq }) => eq(t.roleId, roleId),
  });

  return rolePermissionsResult.map((item) => item.permission).filter(Boolean);
}

const getUser = getAccount;

export { getAccount, getUser, getMyMembership, getMyAllowedMenuIds, getMyOrgPermissions };
