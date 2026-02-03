import { db } from '$lib/server/db';
import { creditPackage, creditTransaction } from '$lib/server/db/schema';
import { eq, and, gt, asc, lte, desc } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export interface CreditPackage {
    id: string;
    userId: string;
    sourceType: 'subscription' | 'order';
    sourceId: string;
    credits: number;
    remainingCredits: number;
    validityPeriod: number | null;
    expiresAt: Date;
    status: 'active' | 'expired' | 'depleted';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreditSummary {
    totalCredits: number;
    packages: CreditPackage[];
}

export interface CreditTransaction {
    id: string;
    userId: string;
    packageId: string;
    amount: number;
    type: 'chat' | 'image' | 'other';
    description: string | null;
    metadata: string | null;
    createdAt: Date;
}

/**
 * Get all active credit packages for a user, sorted by expiration date (earliest first)
 * This ensures we consume credits that are expiring soonest first
 */
export async function getUserCreditPackages(userId: string): Promise<CreditPackage[]> {
    const now = new Date();

    const packages = await db
        .select()
        .from(creditPackage)
        .where(
            and(
                eq(creditPackage.userId, userId),
                eq(creditPackage.status, 'active'),
                gt(creditPackage.remainingCredits, 0),
                gt(creditPackage.expiresAt, now)
            )
        )
        .orderBy(asc(creditPackage.expiresAt)); // Sort by expiration date (earliest first)

    return packages as CreditPackage[];
}

/**
 * Get total available credits for a user
 */
export async function getUserTotalCredits(userId: string): Promise<number> {
    const packages = await getUserCreditPackages(userId);
    return packages.reduce((total, pkg) => total + pkg.remainingCredits, 0);
}

/**
 * Get credit summary for a user (total credits + package details)
 */
export async function getUserCreditSummary(userId: string): Promise<CreditSummary> {
    const packages = await getUserCreditPackages(userId);
    const totalCredits = packages.reduce((total, pkg) => total + pkg.remainingCredits, 0);

    return {
        totalCredits,
        packages
    };
}

/**
 * Consume credits from user's packages
 * Prioritizes packages that are expiring soonest
 *
 * @param userId - User ID
 * @param amount - Amount of credits to consume
 * @param type - Type of consumption ('chat' | 'image' | 'other')
 * @param description - Optional description
 * @param metadata - Optional metadata (will be JSON stringified)
 * @returns true if successful, false if insufficient credits
 */
export async function consumeCredits(
    userId: string,
    amount: number,
    type: 'chat' | 'image' | 'other' = 'other',
    description?: string,
    metadata?: Record<string, any>
): Promise<boolean> {
    if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    // Get all active packages sorted by expiration date
    const packages = await getUserCreditPackages(userId);

    // Check if user has enough credits
    const totalAvailable = packages.reduce((total, pkg) => total + pkg.remainingCredits, 0);
    if (totalAvailable < amount) {
        return false;
    }

    let remainingToConsume = amount;

    // Consume credits from packages, starting with the one expiring soonest
    for (const pkg of packages) {
        if (remainingToConsume <= 0) break;

        const toConsume = Math.min(pkg.remainingCredits, remainingToConsume);
        const newRemaining = pkg.remainingCredits - toConsume;

        // Update package
        await db
            .update(creditPackage)
            .set({
                remainingCredits: newRemaining,
                status: newRemaining === 0 ? 'depleted' : 'active',
                updatedAt: new Date()
            })
            .where(eq(creditPackage.id, pkg.id));

        // Record transaction
        await db.insert(creditTransaction).values({
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            packageId: pkg.id,
            amount: toConsume,
            type,
            description: description || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
            createdAt: new Date()
        });

        remainingToConsume -= toConsume;

        console.log(`💳 Consumed ${toConsume} credits from package ${pkg.id} (${pkg.sourceType})`);
    }

    return true;
}

/**
 * Update expired credit packages status
 * Should be called periodically or before checking credits
 */
export async function updateExpiredPackages(): Promise<number> {
    const now = new Date();

    const result = await db
        .update(creditPackage)
        .set({
            status: 'expired',
            updatedAt: now
        })
        .where(
            and(
                eq(creditPackage.status, 'active'),
                gt(creditPackage.remainingCredits, 0),
                // expiresAt is less than or equal to now
                lte(creditPackage.expiresAt, now)
            )
        );

    return result.rowCount || 0;
}

/**
 * Helper function to get user credits from RequestEvent
 */
export async function getUserCreditsFromEvent(event: RequestEvent): Promise<CreditSummary | null> {
    const session = event.locals.session;
    if (!session?.user?.id) {
        return null;
    }

    return await getUserCreditSummary(session.user.id);
}

/**
 * Helper function to consume credits from RequestEvent
 */
export async function consumeCreditsFromEvent(
    event: RequestEvent,
    amount: number,
    type: 'chat' | 'image' | 'other' = 'other',
    description?: string,
    metadata?: Record<string, any>
): Promise<boolean> {
    const session = event.locals.session;
    if (!session?.user?.id) {
        return false;
    }

    return await consumeCredits(session.user.id, amount, type, description, metadata);
}

/**
 * Get user's credit transaction history
 */
export async function getUserCreditTransactions(
    userId: string,
    limit: number = 50
): Promise<CreditTransaction[]> {
    const transactions = await db
        .select()
        .from(creditTransaction)
        .where(eq(creditTransaction.userId, userId))
        .orderBy(desc(creditTransaction.createdAt))
        .limit(limit);

    return transactions as CreditTransaction[];
}

/**
 * Helper function to get user credit transactions from RequestEvent
 */
export async function getUserCreditTransactionsFromEvent(
    event: RequestEvent,
    limit: number = 50
): Promise<CreditTransaction[] | null> {
    const session = event.locals.session;
    if (!session?.user?.id) {
        return null;
    }

    return await getUserCreditTransactions(session.user.id, limit);
}
