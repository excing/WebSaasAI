<script lang="ts">
    const links = [
        {
            title: "X",
            href: "https://www.x.com/rasmickyy",
        },
        {
            title: "YouTube",
            href: "https://www.youtube.com/@rasmic",
        },
    ];
</script>

<footer class="bg-background py-12">
    <div class="mx-auto max-w-5xl px-6">
        <div class="flex flex-wrap justify-between gap-12">
            <div class="order-last flex items-center gap-3 md:order-first">
                <span class="text-muted-foreground block text-center text-sm">
                    © {new Date().getFullYear()} Exodus Labs, All rights reserved
                </span>
            </div>

            <div
                class="order-first flex flex-wrap gap-x-6 gap-y-4 md:order-last"
            >
                {#each links as link}
                    <a
                        href={link.href}
                        class="text-muted-foreground hover:text-primary block duration-150"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <span>{link.title}</span>
                    </a>
                {/each}
            </div>
        </div>
    </div>
</footer>
