import { createAuthClient } from 'better-auth/svelte';
import { polarClient } from '@polar-sh/better-auth/client';

export const authClient = createAuthClient({
    plugins: [
        polarClient(),
    ]
});
