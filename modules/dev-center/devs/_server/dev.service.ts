"use server";

/**
 * Cell Dev Service
 *
 * 管理這個 NBEE cell 的運維人員（list / add / remove）。
 * 出廠 dev 名單見 ../config.ts 的 DEV_CONFIG.initialDevs
 *
 * TODO: 實作 DB CRUD（用 settings 表 group='auth'，name='staff_emails'）
 *       DB 空時 fallback 到 DEV_CONFIG.initialDevs
 */

type Dev = {
  accountId: string;
  role: string;
  createdAt: Date;
  user: { id: string; email: string; name: string; avatar: string | null };
};

async function getDevs(): Promise<Dev[]> {
  console.warn("[getDevs] not yet implemented (DB CRUD)");
  return [];
}

async function addDev({ email }: { email: string }): Promise<{ accountId: string }> {
  console.warn("[addDev] not yet implemented");
  throw new Error("addDev: DB CRUD not implemented yet");
}

async function removeDev({ id }: { id: string }): Promise<{ accountId: string }> {
  console.warn("[removeDev] not yet implemented");
  throw new Error("removeDev: DB CRUD not implemented yet");
}

export { getDevs, addDev, removeDev, type Dev };
