<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import Sveltekit from "$lib/components/logos/Sveltekit.svelte";
    import BetterAuth from "$lib/components/logos/BetterAuth.svelte";
    import NeonPostgres from "$lib/components/logos/NeonPostgres.svelte";
    import Polar from "$lib/components/logos/Polar.svelte";
    import TailwindCSS from "$lib/components/logos/TailwindCSS.svelte";
    import Shadcnui from "$lib/components/logos/Shadcnui.svelte";

    interface Integration {
        title: string;
        description: string;
        link: string;
        logo: typeof Sveltekit;
    }

    const integrations: Integration[] = [
        {
            title: "SvelteKit",
            description:
                "The full-stack Svelte framework with file-based routing, SSR, and built-in optimizations.",
            link: "https://svelte.dev",
            logo: Sveltekit,
        },
        {
            title: "Better Auth",
            description:
                "Modern authentication library with session management, OAuth providers, and security features.",
            link: "https://better-auth.com",
            logo: BetterAuth,
        },
        {
            title: "Neon Postgres",
            description:
                "Serverless PostgreSQL database with branching, autoscaling, and modern developer experience.",
            link: "https://neon.tech",
            logo: NeonPostgres,
        },
        {
            title: "Polar.sh",
            description:
                "Developer-first subscription platform with webhooks, customer portal, and usage-based billing.",
            link: "https://polar.sh",
            logo: Polar,
        },
        {
            title: "Tailwind CSS",
            description:
                "Utility-first CSS framework for rapid UI development with consistent design tokens.",
            link: "https://tailwindcss.com",
            logo: TailwindCSS,
        },
        {
            title: "shadcn-svelte",
            description:
                "Beautiful, accessible components built with Bits UI primitives and styled with Tailwind CSS.",
            link: "https://shadcn-svelte.com",
            logo: Shadcnui,
        },
    ];
</script>

<section>
    <div class="pb-32 pt-12">
        <div class="mx-auto max-w-5xl px-6">
            <div>
                <h2 class="text-balance text-3xl font-semibold md:text-4xl">
                    Built with the best tools
                </h2>
                <p class="text-muted-foreground mt-3 text-lg">
                    Launch your project with confidence, knowing that you're
                    using the best tools available.
                </p>
            </div>

            <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each integrations as integration}
                    <a
                        href={integration.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block transition-transform hover:scale-105"
                    >
                        <Card.Root
                            class="h-full cursor-pointer rounded-md p-6 transition-shadow hover:shadow-lg"
                        >
                            <div class="relative">
                                <div class="*:size-10">
                                    <integration.logo />
                                </div>

                                <div class="mt-6 space-y-1.5">
                                    <h3 class="text-lg font-semibold">
                                        {integration.title}
                                    </h3>
                                    <p
                                        class="text-muted-foreground line-clamp-2"
                                    >
                                        {integration.description}
                                    </p>
                                </div>
                            </div>
                        </Card.Root>
                    </a>
                {/each}
            </div>
        </div>
    </div>
</section>
