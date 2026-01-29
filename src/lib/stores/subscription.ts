import { writable, get } from 'svelte/store';
import type { SubscriptionDetailsResult } from '$lib/types/subscription';

const _details = writable<SubscriptionDetailsResult | null>(null);
const _loaded = writable(false);
const _loading = writable(false);

let inFlight: Promise<SubscriptionDetailsResult | null> | null = null;

export const subscriptionDetails = { subscribe: _details.subscribe };
export const subscriptionLoaded = { subscribe: _loaded.subscribe };
export const subscriptionLoading = { subscribe: _loading.subscribe };

export function setSubscriptionDetails(details: SubscriptionDetailsResult) {
	_details.set(details);
	_loaded.set(true);
}

export function resetSubscriptionDetails() {
	_details.set(null);
	_loaded.set(false);
	_loading.set(false);
	inFlight = null;
}

export async function refreshSubscriptionDetails(): Promise<SubscriptionDetailsResult> {
	_loading.set(true);
	try {
		const response = await fetch('/api/subscription/details');
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = (await response.json()) as SubscriptionDetailsResult;
		setSubscriptionDetails(data);
		return data;
	} catch (err) {
		console.error('Failed to load subscription details:', err);
		const fallback: SubscriptionDetailsResult = {
			hasSubscription: false,
			error: 'Failed to load subscription details',
			errorType: 'GENERAL'
		};
		setSubscriptionDetails(fallback);
		return fallback;
	} finally {
		_loading.set(false);
	}
}

export async function ensureSubscriptionDetailsLoaded(): Promise<SubscriptionDetailsResult | null> {
	if (get(_loaded)) return get(_details);
	if (inFlight) return inFlight;
	inFlight = refreshSubscriptionDetails().finally(() => {
		inFlight = null;
	});
	return inFlight;
}
