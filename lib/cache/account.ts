import { unstable_cache } from 'next/cache'
import { db } from '@bee/core/lib/db'
import type { TAccount } from '@bee/core/lib/db/schema/auth/accounts'

/**
 * Cached version of getAccountByEmail().
 * Tag: `account:{email}`
 */
export async function cachedGetAccountByEmail(
    email: string,
): Promise<TAccount | null> {
    const cached = unstable_cache(
        async () => {
            const account = await db.query.accounts.findFirst({
                where: (t, { eq: e }) => e(t.email, email),
            })
            return account || null
        },
        [`account:${email}`],
        { tags: [`account:${email}`] },
    )
    return cached()
}
