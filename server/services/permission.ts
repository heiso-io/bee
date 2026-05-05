"use server";

import { auth } from "@heiso-io/bee/modules/auth/auth.config";
import * as roleService from "./role";

const permissionCache = new Map<string, roleService.UserPermission>();

export async function getUserPermissions() {
  const session = await auth();
  const accountId = session?.user?.id;
  if (!accountId) throw new Error("Unauthorized");

  // [MOVED UP] Check Admin FIRST - DevLogin users should always get Admin role
  if (session.user.dev) {
    return {
      role: 'Admin',
      fullAccess: true,
      permissions: [],
    };
  }

  const cached = permissionCache.get(accountId);
  if (cached) return cached;

  const permissions = await roleService.findUserPermissions(accountId);
  permissionCache.set(accountId, permissions);
  return permissions;
}

// export async function filterMenuByPermission(
// 	userId: string,
// 	menus: MenuItem[],
// ): Promise<MenuItem[]> {
// 	const result: MenuItem[] = [];

// 	for (const item of menus) {
// 		const hasAccess =
// 			!item.permission ||
// 			(await can(userId, item.permission.resource, item.permission.action));

// 		if (!hasAccess) continue;

// 		const children = item.children
// 			? await filterMenuByPermission(userId, item.children)
// 			: [];

// 		result.push({ ...item, children });
// 	}

// 	return result;
// }
