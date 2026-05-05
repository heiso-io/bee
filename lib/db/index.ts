import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as {
  sharedClient: postgres.Sql | undefined;
};

export const client =
  globalForDb.sharedClient ?? postgres(process.env.DATABASE_URL, {
    max: 5,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sharedClient = client;

const db = drizzle({ client, schema, logger: true });

export async function closeDb() {
  await client.end({ timeout: 0 });
}

export { db };

export type Db = typeof db;
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
