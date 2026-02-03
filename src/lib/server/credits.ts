import { db } from '$lib/server/db';
import { creditPackage } from '$lib/server/db/schema';
import { eq, and, gt, asc, lte } from 'drizzle-orm';
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
 * @returns true if successful, false if insufficient credits
 */
export async function consumeCredits(userId: string, amount: number): Promise<boolean> {
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
    amount: number
): Promise<boolean> {
    const session = event.locals.session;
    if (!session?.user?.id) {
        return false;
    }

    return await consumeCredits(session.user.id, amount);
}
