import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: event.request.headers });
    event.locals.session = session;

    const { pathname } = event.url;

    // Allow webhook endpoints without authentication
    // Better Auth Polar webhook endpoint: /api/auth/polar/webhooks
    if (pathname.startsWith('/api/auth/polar/webhooks')) {
        return resolve(event);
    }

    // Redirect authenticated users away from auth pages
    if (session?.user && ['/sign-in', '/sign-up'].includes(pathname)) {
        throw redirect(302, '/dashboard');
    }

    // Protect dashboard routes
    if (!session?.user && pathname.startsWith('/dashboard')) {
        throw redirect(302, '/sign-in');
    }

    return resolve(event);
};
