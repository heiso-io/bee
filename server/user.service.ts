"use server";

import {
  getAccountByEmail as getAccountByEmailAdapter,
  getAccountById,
  updateAccount,
} from "@bee/core/lib/accounts/account-adapter";
import { db } from "@bee/core/lib/db";
import type { TAccount } from "@bee/core/lib/db/schema";

// 包成 async function（"use server" 不允許同步 re-export，否則 build 時會被當 server action wrapper、runtime crash）
export async function getAccountByEmail(email: string) {
  return getAccountByEmailAdapter(email);
}

/**
 * Get all accounts
 */
export async function getUsers() {

  return await db.query.accounts.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserById(id: string) {
  return await getAccountById(id);
}

/**
 * 透過邀請 token 取得邀請資訊
 * 統一使用 accounts 表
 */
export async function getInvitation(token: string) {

  const account = await db.query.accounts.findFirst({
    columns: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      inviteToken: true,
      inviteExpiredAt: true,
      status: true,
    },
    where: (table, { eq, isNull, and }) =>
      and(eq(table.inviteToken, token), isNull(table.deletedAt)),
  });

  if (!account) {
    return {
      invitation: null,
      user: null,
    };
  }

  return {
    invitation: {
      id: account.id,
      accountId: account.id,
      inviteToken: account.inviteToken,
      inviteExpiredAt: account.inviteExpiredAt,
      status: account.status,
    },
    user: account,
  };
}

export async function getAccount(id: string) {
  return await getAccountById(id);
}

export async function getUser(email: string) {
  return await getAccountByEmailAdapter(email);
}

/**
 * Update account


 */
export async function update(id: string, data: Partial<TAccount>) {
  try {
    await updateAccount(id, data);
  } catch (error) {
    console.error("Failed to update account:", error);
    throw error;
  }
}
