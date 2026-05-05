// Files schema split into 3 files for clarity:
//   files.ts   — 主表(含 Phase B 新欄位:tenantId / hash / scanStatus / EXIF)
//   folders.ts — 資料夾(原 file_storage_categories,已 rename)
//   tags.ts    — 標籤 + 檔案↔標籤 mapping(原 file_tag_relations,已 rename 為 file_tag_mapping)

export * from "./files";
export * from "./folders";
export * from "./tags";
