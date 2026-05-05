"use server";

import { sendInvite } from "@bee/core/modules/permission/team/_server/team.service";
import { type Transaction } from "@bee/core/lib/db";
import { accounts } from "@bee/core/lib/db/schema";
import { generateInviteToken } from "@bee/core/lib/id-generator";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@bee/core/lib/db";


/**
 * 取得所有帳號 (用於管理介面)
 */
export async function getAccounts() {

  const result = await db.query.accounts.findMany({
    where: (t, { isNull }) => isNull(t.deletedAt),
  });
  return result;
}

/**
 * 取得成員的登入方式
 * @param accountId - Account ID
 */
export async function getLoginMethod(accountId: string) {

  const account = await db.query.accounts.findFirst({
    columns: { loginMethod: true },
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });

  return account?.loginMethod ?? "email";
}

/**
 * 取得成員狀態
 * 統一使用 accounts 表
 * @param accountId - Account ID
 */
export async function getMemberStatus(accountId: string) {

  const account = await db.query.accounts.findFirst({
    columns: { status: true },
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });
  return account?.status ?? null;
}

/**
 * 透過 accountId 取得成員資訊
 * 統一使用 accounts 表
 * @param accountId - Account ID
 */
export async function getMember(accountId: string) {

  const account = await db.query.accounts.findFirst({
    columns: {
      id: true,
      status: true,
      roleId: true,
      role: true,
    },
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });

  if (!account) return null;

  return {
    id: account.id,
    accountId: account.id,
    status: account.status,
    roleId: account.roleId,
    role: account.role,
  };
}

/**
 * 透過 accountId 取得成員的邀請 token
 * 統一使用 accounts 表
 * @param accountId - Account ID
 */
export async function getMemberInviteToken(accountId: string) {

  const account = await db.query.accounts.findFirst({
    columns: { inviteToken: true },
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });
  return account?.inviteToken ?? null;
}

/**
 * 取得帳號資訊
 * @param accountId - Account ID
 */
export async function getAccount(accountId: string) {

  const account = await db.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });
  return account ?? null;
}

/**
 * 重寄邀請 email 給成員
 * @param email - Email
 */
export async function resendInviteByEmail(email: string) {
  const account = await getAccountByEmail(email);
  if (!account) {
    throw new Error("Account not found");
  }
  return resendInviteByAccountId(account.id);
}

/**
 * 重寄邀請 email 給成員
 * 統一使用 accounts 表
 * @param accountId - Account ID
 */
export async function resendInviteByAccountId(accountId: string) {
  const inviteToken = generateInviteToken();
  const inviteExpiredAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const account = await db.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });

  if (!account) {
    throw new Error("Account not found");
  }

  await db
    .update(accounts)
    .set({
      inviteToken,
      inviteExpiredAt,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId));

  const result = await sendInvite({
    email: account.email,
    inviteToken,
    isOwner: account.role === "owner",
  });

  return result;
}

/**
 * 確保帳號有有效的邀請 token（不發送 email）
 * - 若 token 遺失或過期，刷新 token
 * 統一使用 accounts 表
 * @param accountId - Account ID
 */
export async function ensureInviteTokenSilently(accountId: string) {
  const now = Date.now();

  const account = await db.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });

  if (!account) return null;

  const needsNewToken =
    !account.inviteToken ||
    !account.inviteExpiredAt ||
    account.inviteExpiredAt.getTime() < now;

  if (needsNewToken) {
    const inviteToken = generateInviteToken();
    const inviteExpiredAt = new Date(now + 1000 * 60 * 60 * 24 * 7);

    const [updated] = await db
      .update(accounts)
      .set({
        inviteToken,
        inviteExpiredAt,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))
      .returning({ inviteToken: accounts.inviteToken });

    return updated?.inviteToken ?? null;
  }

  return account.inviteToken;
}

/**
 * 首次登入：設定帳號狀態為 active
 * 統一使用 accounts 表
 *
 * 若租戶 DB 中查無帳號（例如透過 Hive CLI 建立的帳號），
 * 會從 cell DB 拉取帳號資訊並 INSERT 至租戶 DB。
 *
 * @param accountId - Account ID
 * @param tx - 可選的 transaction
 */
export async function ensureMemberOnFirstLogin(
  accountId: string,
  tx?: Transaction,
) {
  const d = tx ?? db;

  let account = await d.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.id, accountId), isNull(t.deletedAt)),
  });

  if (!account) {
    return null;
  }

  const existingOwner = await d.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.role, "owner"), isNull(t.deletedAt)),
    columns: { id: true },
  });

  const shouldBeOwner = !existingOwner;
  let assignedRoleId = account.roleId;

  if ((shouldBeOwner || account.role === "owner") && !assignedRoleId) {
    const adminRole = await d.query.roles.findFirst({
      where: (t, { eq, isNull }) =>
        and(eq(t.name, "Admin"), isNull(t.deletedAt)),
      columns: { id: true },
    });
    if (adminRole) {
      assignedRoleId = adminRole.id;
    }
  }

  const [updated] = await d
    .update(accounts)
    .set({
      roleId: assignedRoleId,
      status: "active",
      role: account.role === "owner" || shouldBeOwner ? "owner" : account.role,
      joinedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId))
    .returning({
      id: accounts.id,
      status: accounts.status,
      role: accounts.role,
    });

  if (updated) {
    try {
      const { revalidateTag } = await import("next/cache");
      revalidateTag(`membership:${updated.id}`, "default");
    } catch {}
  }
  return updated
    ? { ...updated, accountId: updated.id }
    : null;
}

/**
 * 檢查當前 tenant 是否有 owner
 * 統一使用 accounts 表
 */
export async function checkTenantHasOwner() {

  const owner = await db.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.role, "owner"), isNull(t.deletedAt)),
    columns: { id: true },
  });
  return !!owner;
}

/**
 * 透過 email 取得帳號
 */
export async function getAccountByEmail(email: string) {

  const account = await db.query.accounts.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });
  return account ?? null;
}

/**
 * 透過 email 取得帳號 (包含密碼)
 */
export async function getAccountWithPasswordByEmail(email: string) {
  const account = await db.query.accounts.findFirst({
    where: (t, { eq, isNull }) =>
      and(eq(t.email, email), isNull(t.deletedAt)),
  });

  if (!account) return null;

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    password: account.password,
    active: account.active,
    avatar: account.avatar,
    lastLoginAt: account.lastLoginAt,
  };
}

