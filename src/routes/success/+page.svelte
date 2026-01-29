<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import confetti from "canvas-confetti";

    const checkoutId = $derived($page.url.searchParams.get("checkout_id"));

    onMount(() => {
        // Trigger confetti on mount
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
        });
    });
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-4">
    <div class="w-full max-w-md space-y-6 text-center">
        <div class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight">
                🎉 Payment Successful!
            </h1>
            <p class="text-muted-foreground">
                Thank you for your purchase. Your subscription is now active.
            </p>
        </div>

        {#if checkoutId}
            <p class="text-sm text-muted-foreground">
                Checkout ID: {checkoutId}
            </p>
        {/if}

        <div class="flex flex-col gap-3">
            <Button onclick={() => goto("/dashboard")}>Go to Dashboard</Button>
            <Button variant="outline" onclick={() => goto("/")}
                >Back to Home</Button
            >
        </div>
    </div>
</div>
