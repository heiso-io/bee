"use server";

import { db } from "@heiso-io/bee/lib/db";
import { accounts } from "@heiso-io/bee/lib/db/schema";
import { auth } from "@heiso-io/bee/modules/auth/auth.config";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
/**
 * 取得當前帳號的成員資格
 * 統一使用 accounts 表
 */
async function getMembership() {
  const session = await auth();
  const accountId = session?.user?.id;

  if (!accountId) {
    throw new Error("Unauthorized");
  }

  const staff = session.user.staff ?? false;

  if (staff) {
    return { staff, membership: null };
  }

  const account = await db.query.accounts.findFirst({
    columns: {
      id: true,
      role: true,
      roleId: true,
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
      and(eq(t.id, accountId), eq(t.status, "active"), isNull(t.deletedAt)),
  });

  return {
    staff,
    membership: account
      ? { id: account.id, role: account.role, customRole: account.customRole }
      : null,
  };
}

/**
 * 透過邀請 token 取得邀請資訊
 * 統一使用 accounts 表
 */
async function getInviteToken({ token }: { token: string }) {

  const account = await db.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.inviteToken, token), isNull(t.deletedAt)),
  });

  if (!account) return null;

  if (!account.inviteExpiredAt || account.inviteExpiredAt < new Date()) {
    return null;
  }

  return {
    id: account.id,
    accountId: account.id,
    inviteToken: account.inviteToken,
    inviteExpiredAt: account.inviteExpiredAt,
    status: account.status,
    account,
  };
}

/**
 * 加入團隊
 * 統一使用 accounts 表
 */
async function join(memberId: string) {

  const result = await db
    .update(accounts)
    .set({
      inviteToken: null,
      inviteExpiredAt: null,
      status: "active",
      joinedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.id, memberId), isNull(accounts.deletedAt)));

  return result;
}

/**
 * 拒絕邀請
 * 統一使用 accounts 表
 */
async function decline(id: string) {

  return await db
    .update(accounts)
    .set({
      inviteToken: null,
      inviteExpiredAt: null,
      status: "suspended",
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, id));
}

async function removeJoinToken() {
  const cookieStore = await cookies();
  cookieStore.delete("join-token");
}

export { getMembership, getInviteToken, join, decline, removeJoinToken };

/**
 * 更新使用者基本資料（名稱、頭像、密碼）
 * 統一使用 accounts 表
 */
export async function updateBasicProfile({
  accountId,
  name,
  avatar,
  password,
}: {
  accountId: string;
  name?: string;
  avatar?: string | null;
  password?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== accountId) {
    throw new Error("Unauthorized");
  }


  const updates: Record<string, any> = { updatedAt: new Date() };

  if (name !== undefined) updates.name = name;
  if (avatar !== undefined) updates.avatar = avatar;

  if (typeof password === "string" && password.trim().length > 0) {
    const { hashPassword } = await import("@heiso-io/bee/lib/hash");
    updates.password = await hashPassword(password.trim());
  }

  await db.update(accounts).set(updates).where(eq(accounts.id, accountId));

  return { ok: true };
}
