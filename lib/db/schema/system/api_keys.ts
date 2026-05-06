import { generateId } from "@heiso-io/bee/lib/id-generator";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { members } from "../auth/members";

// API Keys table
export const apiKeys = pgTable(
  "api_keys",
  {
    id: varchar("id", { length: 20 })
      .primaryKey()
      .$defaultFn(() => generateId()),
    memberId: varchar("member_id", { length: 50 })
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    truncatedKey: varchar("truncated_key", { length: 30 }).notNull(),
    rateLimitRequests: integer("rate_limit_requests").notNull().default(100),
    rateLimitWindowSeconds: integer("rate_limit_window_seconds")
      .notNull()
      .default(60),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("api_keys_member_id_idx").on(table.memberId),
    index("api_keys_key_idx").on(table.key),
    index("api_keys_deleted_at_idx").on(table.deletedAt),
  ],
);

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  member: one(members, {
    fields: [apiKeys.memberId],
    references: [members.id],
  }),
}));

// Types
export type TApiKey = typeof apiKeys.$inferSelect;
export type TInsertApiKey = typeof apiKeys.$inferInsert;

export type TCreateApiKey = Omit<
  TInsertApiKey,
  "id" | "memberId" | "key" | "truncatedKey" | "createdAt" | "updatedAt" | "deletedAt"
>;
export type TUpdateApiKey = Partial<Pick<TApiKey, "name" | "expiresAt">>;

export type TPublicApiKey = Omit<TApiKey, "key" | "deletedAt">;
