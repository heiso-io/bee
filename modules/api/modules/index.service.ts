import { db } from "@heiso-io/bee/lib/db";
import { apiKeys } from "@heiso-io/bee/lib/db/schema";
import { hashApiKey } from "@heiso-io/bee/lib/hash";
import { eq } from "drizzle-orm";

// Verify API key (for authentication middleware)
export async function verifyApiKey(key: string): Promise<{
  valid: boolean;
  memberId?: string;
  apiKeyId?: string;
  rateLimit?: {
    window: number;
    requests: number;
  } | null;
}> {

  if (!key) {
    return { valid: false };
  }

  try {
    const hashedKey = await hashApiKey(key);

    const apiKey = await db.query.apiKeys.findFirst({
      columns: {
        id: true,
        memberId: true,
        rateLimitRequests: true,
        rateLimitWindowSeconds: true,
        expiresAt: true,
      },
      where: (t, { and, eq, isNull }) =>
        and(
          eq(t.key, hashedKey),
          isNull(t.deletedAt),
        ),
    });

    if (!apiKey) {
      return { valid: false };
    }

    // Check if key is expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false };
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    return {
      valid: true,
      memberId: apiKey.memberId ?? undefined,
      apiKeyId: apiKey.id,
      rateLimit: {
        window: apiKey.rateLimitWindowSeconds,
        requests: apiKey.rateLimitRequests,
      },
    };
  } catch (error) {
    console.error("Error verifying API key:", error);
    return { valid: false };
  }
}

// API key access log → structured stdout (Vercel captures + drains to S3)
// 之前是寫進 apiKeyAccessLogs DB table，已改為 stdout pattern。
export async function storeApiKeyAccessLog(params: {
  apiKeyId: string;
  memberId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  userAgent?: string;
  ipAddress?: string;
  responseTime: number;
  errorMessage?: string;
}): Promise<void> {
  console.log(JSON.stringify({
    type: "api_key_access",
    apiKeyId: params.apiKeyId,
    memberId: params.memberId,
    endpoint: params.endpoint,
    method: params.method,
    statusCode: params.statusCode,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
    responseTime: params.responseTime,
    errorMessage: params.errorMessage,
    timestamp: new Date().toISOString(),
  }));
}
