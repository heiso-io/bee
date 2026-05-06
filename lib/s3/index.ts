"use server";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getTenantIdOrThrow } from "@heiso-io/bee/lib/utils/tenant";

const kExpiresIn = 5 * 60; // 5 min(對齊 assets-foundation §5)

let s3Client: S3Client | null = null;

export type Visibility = "public" | "private";

export async function initS3Client() {
  if (s3Client) return s3Client;

  const accessKey = process.env.NBEE_AWS_ACCESS_KEY;
  const secretKey = process.env.NBEE_AWS_SECRET_KEY;
  const region = process.env.NBEE_AWS_S3_REGION;
  if (!accessKey || !secretKey || !region) {
    throw new Error(
      "NBEE_AWS_ACCESS_KEY / SECRET_KEY / S3_REGION 未設定（檢查 .env.local 與 @heiso-io/bee/config/setting）",
    );
  }

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  return s3Client;
}

/**
 * 依 visibility 取對應 bucket name（直接讀 process.env，由 next.config.ts 從 SETTING 注入）。
 */
async function getBucketName(visibility: Visibility): Promise<string> {
  if (visibility === "public") {
    const bucket = process.env.NBEE_AWS_S3_BUCKET_PUBLIC;
    if (!bucket) throw new Error("NBEE_AWS_S3_BUCKET_PUBLIC 未設定");
    return bucket;
  }
  const bucket = process.env.NBEE_AWS_S3_BUCKET_PRIVATE;
  if (!bucket) throw new Error("NBEE_AWS_S3_BUCKET_PRIVATE 未設定");
  return bucket;
}

/**
 * 產 pre-signed PUT URL,給 client 直傳 S3 用。
 * Tenant 一律由 server 端 `process.env.TENANT_ID` 決定,client 無法干預(防偽造)。
 *
 * @param filename S3 key 後段(例:`{sha256}.jpg`),前面會加 `{tenant}/`
 * @param visibility 'public' (default) | 'private'
 */
export async function getPreSignedUrl(
  filename: string,
  visibility: Visibility = "public",
) {
  const s3Client = await initS3Client();
  const bucket = await getBucketName(visibility);

  const tenant = getTenantIdOrThrow();
  const path = `${tenant}/${filename}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: kExpiresIn });

  return { path, url };
}

/**
 * 簽 GET URL,給 private bucket 走 server-side download 用。
 * 5 min 過期(對齊 PUT)。
 *
 * @param path       完整 S3 key(已含 `{tenant}/` 前綴,即 row 的 file.path)
 * @param visibility 'private' (default) | 'public' — public 通常走 CDN,不需要簽
 */
export async function getPreSignedDownloadUrl(
  path: string,
  visibility: Visibility = "private",
) {
  const s3Client = await initS3Client();
  const bucket = await getBucketName(visibility);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  return getSignedUrl(s3Client, command, { expiresIn: kExpiresIn });
}
