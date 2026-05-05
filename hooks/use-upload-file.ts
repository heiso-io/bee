import {
  ourFileRouter,
  type UploadedFile,
} from "@heiso-io/bee/lib/upload-router";
import { useUploadS3File } from "./use-upload-s3-file";

interface UploadFileOptions {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: Error) => void;
  onCancel?: () => void;
}

// tenant 由 server-side env(TENANT_ID)決定,client 不再硬寫
// CDN host 由 NEXT_PUBLIC_CDN_URL 決定,沒設 fallback nbee-cdn.heiso.io
export const useUploadFile = (options?: UploadFileOptions) => {
  return useUploadS3File({
    router: ourFileRouter,
    endpoint: "general",
    onSuccess: options?.onUploadComplete,
    onError: options?.onUploadError,
    onCancel: options?.onCancel,
  });
};
