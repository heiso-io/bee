import { generateId } from "@bee/core/lib/id-generator";
import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import type zod from "zod";
import { files } from "./files";

// 標籤定義
export const fileTags = pgTable(
  "file_tags",
  {
    id: varchar("id", { length: 20 })
      .primaryKey()
      .$defaultFn(() => generateId()),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("file_tags_name_idx").on(table.name)],
);

export const fileTagsRelations = relations(fileTags, ({ many }) => ({
  fileMappings: many(fileTagMapping),
}));

// 檔案 ↔ 標籤 多對多 mapping(原 file_tag_relations)
export const fileTagMapping = pgTable(
  "file_tag_mapping",
  {
    id: varchar("id", { length: 20 })
      .primaryKey()
      .$defaultFn(() => generateId()),
    fileId: varchar("file_id", { length: 20 })
      .references(() => files.id)
      .notNull(),
    tagId: varchar("tag_id", { length: 20 })
      .references(() => fileTags.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("file_tag_mapping_file_tag_idx").on(table.fileId, table.tagId),
  ],
);

export const fileTagMappingRelations = relations(fileTagMapping, ({ one }) => ({
  file: one(files, {
    fields: [fileTagMapping.fileId],
    references: [files.id],
  }),
  tag: one(fileTags, {
    fields: [fileTagMapping.tagId],
    references: [fileTags.id],
  }),
}));

export const fileTagsSchema = createSelectSchema(fileTags);
export type FileTag = zod.infer<typeof fileTagsSchema>;
