import { db } from '$lib/server/db';
import { product } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ProductDetails, ProductsResult } from '$lib/types/product';

export const GET: RequestHandler = async () => {
    try {
        // Fetch all non-archived products, ordered by creation date
        const products = await db
            .select()
            .from(product)
            .where(eq(product.isArchived, false))
            .orderBy(asc(product.createdAt));

        // Transform database results to ProductDetails
        const productDetails: ProductDetails[] = products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            isRecurring: p.isRecurring,
            isArchived: p.isArchived,
            recurringInterval: p.recurringInterval,
            organizationId: p.organizationId,
            prices: JSON.parse(p.prices),
            benefits: JSON.parse(p.benefits),
            createdAt: p.createdAt,
            modifiedAt: p.modifiedAt,
        }));

        // Sort: subscription products first, then one-time products
        const sortedProducts = productDetails.sort((a, b) => {
            if (a.isRecurring && !b.isRecurring) return -1;
            if (!a.isRecurring && b.isRecurring) return 1;
            return 0;
        });

        const result: ProductsResult = {
            products: sortedProducts,
        };

        return json(result);
    } catch (error) {
        console.error('Error fetching products:', error);
        return json({ products: [], error: 'Failed to fetch products' } satisfies ProductsResult, { status: 500 });
    }
};
