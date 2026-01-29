import { getSubscriptionDetails } from '$lib/server/subscription';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    const subscriptionDetails = await getSubscriptionDetails(event);
    return json(subscriptionDetails);
};

