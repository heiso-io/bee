"use server";

/**
 * Cell Staff Service
 *
 * 管理這個 NBEE cell 的運維人員（list / add / remove）。
 * 出廠 staff 名單見 ../config.ts 的 STAFF_CONFIG.initialStaff
 *
 * TODO: 實作 DB CRUD（用 settings 表 group='auth'，name='staff_emails'）
 *       DB 空時 fallback 到 STAFF_CONFIG.initialStaff
 */

type Staff = {
  accountId: string;
  role: string;
  createdAt: Date;
  user: { id: string; email: string; name: string; avatar: string | null };
};

async function getStaff(): Promise<Staff[]> {
  console.warn("[getStaff] not yet implemented (DB CRUD)");
  return [];
}

async function addStaff({ email }: { email: string }): Promise<{ accountId: string }> {
  console.warn("[addStaff] not yet implemented");
  throw new Error("addStaff: DB CRUD not implemented yet");
}

async function removeStaff({ id }: { id: string }): Promise<{ accountId: string }> {
  console.warn("[removeStaff] not yet implemented");
  throw new Error("removeStaff: DB CRUD not implemented yet");
}

export { getStaff, addStaff, removeStaff, type Staff };
