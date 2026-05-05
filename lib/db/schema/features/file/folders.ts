import { generateId } from "@heiso-io/bee/lib/id-generator";
import { relations } from "drizzle-orm";
import { index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import type zod from "zod";
import { files } from "./files";

// 檔案分類 / 資料夾(原 file_storage_categories,精簡命名)
export const fileFolders = pgTable(
  "file_folders",
  {
    id: varchar("id", { length: 20 })
      .primaryKey()
      .$defaultFn(() => generateId()),
    name: varchar("name", { length: 50 }).notNull(),
    icon: varchar("icon", { length: 50 }).notNull(),
    color: varchar("color", { length: 20 }).notNull(),
    fileCount: integer("file_count").notNull().default(0),
    size: integer("size").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("file_folders_name_idx").on(table.name)],
);

export const fileFoldersRelations = relations(fileFolders, ({ many }) => ({
  files: many(files),
}));

export const fileFoldersSchema = createSelectSchema(fileFolders);

export type FileFolder = zod.infer<typeof fileFoldersSchema>;
