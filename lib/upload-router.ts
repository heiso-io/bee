import { saveFile } from "@bee/core/server/file.service";
import type { Visibility } from "./s3";
import { literalToByte } from "./format";

export type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
  hash: string;
  path: string;
  visibility: Visibility;
};

export type FileRouter = {
  [K: string]: {
    accept?: string[];
    maxSize: number;
    visibility?: Visibility; // 預設 'public'
    middleware?: () => Promise<Record<string, unknown>>;
    onUploadComplete: (
      file: UploadedFile,
      metadata: Record<string, unknown>,
    ) => Promise<void>;
  };
};

export const ourFileRouter: FileRouter = {
  general: {
    maxSize: literalToByte("200MB"), // 200MB
    visibility: "public",
    onUploadComplete: async (file) => {
      await saveFile(file);
    },
  },
  editor: {
    accept: ["image/*", "video/*", "text/*", "application/pdf"],
    maxSize: literalToByte("500MB"), // 500MB
    visibility: "public",
    onUploadComplete: async (file) => {
      await saveFile(file);
    },
  },
  logo: {
    accept: ["image/*"],
    maxSize: literalToByte("3MB"), // 3MB
    visibility: "public",
    onUploadComplete: async (file) => {
      await saveFile(file);
    },
  },
  // Dataroom / 私密文件:走 nbee-private-tokyo
  vault: {
    maxSize: literalToByte("500MB"),
    visibility: "private",
    onUploadComplete: async (file) => {
      await saveFile(file);
    },
  },
};
