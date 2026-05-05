export const APP_MODE = "core";

/**
 * Retrieves the current tenant ID from environment.
 */
export function getTenantId(): string | undefined {
  if (process.env.TENANT_ID) {
    return process.env.TENANT_ID;
  }

  if (process.env.APP_MODE === APP_MODE) {
    return APP_MODE;
  }

  return undefined;
}

/**
 * 嚴格版本：production 必須有 TENANT_ID，否則 throw；
 * dev/preview fallback 到 "test"。用於 S3 / file storage 等需要 tenant prefix 的場景。
 */
export function getTenantIdOrThrow(): string {
  const tenant = process.env.TENANT_ID;
  if (!tenant) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TENANT_ID environment variable is required in production",
      );
    }
    return "test";
  }
  return tenant;
}
