<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import GetStartedButton from "$lib/components/common/GetStartedButton.svelte";
</script>

<section class="py-20">
    <div class="relative z-10 mx-auto w-full max-w-2xl px-6 lg:px-0">
        <div class="relative text-center">
            <p class="text-3xl">🔥</p>
            <h1
                class="mx-auto mt-12 max-w-xl text-balance text-5xl font-medium"
            >
                SvelteKit Starter Kit
            </h1>
            <p
                class="text-muted-foreground mx-auto mb-6 mt-4 text-balance text-xl"
            >
                This powerful starter kit is designed to help you launch your
                SAAS application quickly and efficiently.
            </p>
            <div
                class="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:justify-center sm:*:w-auto"
            >
                <GetStartedButton href="/dashboard" variant="default" size="sm">
                    <span class="text-nowrap">Get Started</span>
                </GetStartedButton>
                <Button
                    href="https://github.com/excing/svelte-starter-kit"
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="sm"
                >
                    <span class="text-nowrap">Github</span>
                </Button>
            </div>
        </div>

        <div class="relative mt-8 overflow-hidden rounded-3xl bg-black/10">
            <img
                src="https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt=""
                class="absolute inset-0 size-full object-cover"
            />

            <div
                class="bg-background rounded-(--radius) relative m-4 overflow-hidden border border-transparent shadow-xl shadow-black/15 ring-1 ring-black/10 sm:m-8 md:m-12"
            >
                <img
                    src="/image/svelte-starter-kit-1024-q50.jpg"
                    alt="app screen"
                    class="object-top-left size-full object-cover"
                />
            </div>
        </div>
    </div>
</section>
