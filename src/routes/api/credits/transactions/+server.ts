import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserCreditTransactionsFromEvent } from '$lib/server/credits';

/**
 * GET /api/credits/transactions
 * Get user's credit transaction history
 */
export const GET: RequestHandler = async (event) => {
    const session = event.locals.session;

    if (!session?.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(event.request.url);
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 50;

        // Get user's transaction history
        const transactions = await getUserCreditTransactionsFromEvent(event, limit);

        if (!transactions) {
            return json({ error: 'Failed to fetch transactions' }, { status: 500 });
        }

        return json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching credit transactions:', error);
        return json(
            {
                error: 'Failed to fetch transactions',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
};
