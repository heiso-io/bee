"use server";

import { db } from "@bee/core/lib/db";
import type { TAccount } from "@bee/core/lib/db/schema/auth/accounts";
import { accounts } from "@bee/core/lib/db/schema/auth/accounts";
import { eq } from "drizzle-orm";

/**
 * 取得帳號 by Email
 */
export async function getAccountByEmail(
  email: string,
): Promise<TAccount | null> {
  const account = await db.query.accounts.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });
  return account || null;
}

/**
 * 取得帳號 by ID
 */
export async function getAccountById(id: string): Promise<TAccount | null> {
  const account = await db.query.accounts.findFirst({
    where: (t, { eq }) => eq(t.id, id),
  });
  return account || null;
}

/**
 * 建立帳號
 */
export async function createAccount(data: {
  email: string;
  name: string;
  password: string;
  role?: string;
  status?: string;
}): Promise<TAccount> {
  const [account] = await db
    .insert(accounts)
    .values({
      email: data.email,
      name: data.name,
      password: data.password,
      role: (data.role as any) || "member",
      status: (data.status as any) || "invited",
      active: true,
    })
    .returning();

  return account;
}

/**
 * 更新帳號
 */
export async function updateAccount(
  id: string,
  data: Partial<TAccount>,
): Promise<void> {
  await db
    .update(accounts)
    .set(data as any)
    .where(eq(accounts.id, id));
}

/**
 * 驗證密碼
 */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const account = await db.query.accounts.findFirst({
    where: (t, { eq }) => eq(t.email, email),
    columns: { password: true },
  });

  if (!account) return false;

  const { verifyPassword: verifyHash } = await import("@bee/core/lib/hash");
  return await verifyHash(password, account.password);
}

/**
 * 檢查是否有任何帳號
 */
export async function hasAnyAccount(): Promise<boolean> {
  const first = await db.query.accounts.findFirst({
    columns: { id: true },
  });
  return !!first;
}
