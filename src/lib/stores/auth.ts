import { writable, get } from 'svelte/store';
import { authClient } from '$lib/auth-client';

export type AuthUser = {
	// Minimal shape used across UI (keep flexible)
	id: string;
	name?: string | null;
	email: string;
	image?: string | null;
	[key: string]: unknown;
};

const _user = writable<AuthUser | null>(null);
const _loaded = writable(false);
const _loading = writable(false);

let inFlight: Promise<AuthUser | null> | null = null;

export const currentUser = { subscribe: _user.subscribe };
export const authLoaded = { subscribe: _loaded.subscribe };
export const authLoading = { subscribe: _loading.subscribe };

export function setCurrentUser(user: AuthUser | null) {
	_user.set(user);
	_loaded.set(true);
}

/**
 * Initialize auth state from SvelteKit layout data.
 * `session` comes from `src/routes/+layout.server.ts`.
 */
export function initAuthFromLayout(session: unknown) {
	const sessionUser = (session as any)?.user ?? null;
	const loaded = get(_loaded);
	const existing = get(_user);

	// First initialization: trust the server session.
	if (!loaded) {
		setCurrentUser(sessionUser);
		return;
	}

	// If server says "no session", clear local user.
	if (!sessionUser) {
		if (existing) setCurrentUser(null);
		else _loaded.set(true);
		return;
	}

	// If user changed (login as different user), replace.
	if (!existing || existing.id !== sessionUser.id) {
		setCurrentUser(sessionUser);
		return;
	}

	// Same user: merge in a way that preserves local patches (existing wins).
	_user.set({ ...(sessionUser as any), ...(existing as any) });
	_loaded.set(true);
}

export function patchCurrentUser(patch: Partial<AuthUser>) {
	_user.update((u) => (u ? ({ ...u, ...patch } as AuthUser) : u));
}

export function clearAuthState() {
	// After sign-out we know the user is null
	setCurrentUser(null);
}

export async function refreshCurrentUser(): Promise<AuthUser | null> {
	_loading.set(true);
	try {
		const result = await authClient.getSession();
		const user = (result as any)?.data?.user ?? null;
		setCurrentUser(user);
		return user;
	} catch (err) {
		console.error('Failed to refresh session:', err);
		// Still mark as loaded to avoid infinite spinners
		setCurrentUser(null);
		return null;
	} finally {
		_loading.set(false);
	}
}

export async function ensureCurrentUserLoaded(): Promise<AuthUser | null> {
	if (get(_loaded)) return get(_user);
	if (inFlight) return inFlight;
	inFlight = refreshCurrentUser().finally(() => {
		inFlight = null;
	});
	return inFlight;
}
