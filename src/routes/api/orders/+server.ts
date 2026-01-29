import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    const session = event.locals.session;

    if (!session?.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orders = await db
            .select()
            .from(order)
            .where(eq(order.userId, session.user.id))
            .orderBy(desc(order.createdAt));

        return json({
            orders: orders.map((o) => ({
                id: o.id,
                productId: o.productId,
                productName: o.productName,
                status: o.status,
                paid: o.paid,
                totalAmount: o.totalAmount,
                currency: o.currency,
                createdAt: o.createdAt.toISOString(),
                billingReason: o.billingReason,
                invoiceNumber: o.invoiceNumber
            }))
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
};
