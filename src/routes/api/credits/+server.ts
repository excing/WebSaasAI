import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    getUserCreditSummary,
    consumeCredits,
    updateExpiredPackages
} from '$lib/server/credits';

/**
 * GET /api/credits
 * Get user's credit summary (total credits and package details)
 */
export const GET: RequestHandler = async (event) => {
    const session = event.locals.session;

    if (!session?.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Update expired packages before fetching
        await updateExpiredPackages();

        // Get user's credit summary
        const summary = await getUserCreditSummary(session.user.id);

        return json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching credits:', error);
        return json(
            {
                error: 'Failed to fetch credits',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
};

/**
 * POST /api/credits
 * Consume credits from user's packages
 *
 * Request body:
 * {
 *   "amount": number  // Amount of credits to consume
 * }
 */
export const POST: RequestHandler = async (event) => {
    const session = event.locals.session;

    if (!session?.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await event.request.json();
        const { amount } = body;

        // Validate amount
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return json(
                {
                    error: 'Invalid amount',
                    details: 'Amount must be a positive number'
                },
                { status: 400 }
            );
        }

        // Update expired packages before consuming
        await updateExpiredPackages();

        // Consume credits
        const success = await consumeCredits(session.user.id, amount);

        if (!success) {
            return json(
                {
                    error: 'Insufficient credits',
                    details: 'Not enough credits available'
                },
                { status: 400 }
            );
        }

        // Get updated credit summary
        const summary = await getUserCreditSummary(session.user.id);

        return json({
            success: true,
            message: `Successfully consumed ${amount} credits`,
            data: summary
        });
    } catch (error) {
        console.error('Error consuming credits:', error);
        return json(
            {
                error: 'Failed to consume credits',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
};
