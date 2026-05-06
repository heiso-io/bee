import { generateId } from "@heiso-io/bee/lib/id-generator";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { members } from "./members";

/**
 * member2faCode - 2FA 驗證碼
 */
export const member2faCode = pgTable(
  "member_2fa_code",
  {
    id: varchar("id", { length: 20 })
      .primaryKey()
      .$default(() => generateId()),
    memberId: varchar("member_id", { length: 50 })
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    used: boolean("used").default(false),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("member_2fa_code_member_id_idx").on(table.memberId),
    index("member_2fa_code_valid_idx").on(table.used, table.expiresAt),
  ],
);
