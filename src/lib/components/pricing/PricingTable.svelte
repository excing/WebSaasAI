<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import GetStartedButton from "$lib/components/common/GetStartedButton.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { authClient } from "$lib/auth-client";
    import { Check, Loader2 } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    import { PUBLIC_STARTER_TIER } from "$env/static/public";

	    import type { SubscriptionDetailsResult } from "$lib/types/subscription";
	    import {
	        ensureSubscriptionDetailsLoaded,
	        resetSubscriptionDetails,
	        setSubscriptionDetails,
	        subscriptionDetails as subscriptionDetailsStore,
	        subscriptionLoaded,
	        subscriptionLoading,
	    } from "$lib/stores/subscription";

    interface Props {
        subscriptionDetails?: SubscriptionDetailsResult;
    }

    let { subscriptionDetails: initialSubscriptionDetails }: Props = $props();

	    const emptyDetails: SubscriptionDetailsResult = { hasSubscription: false };
	    let subscriptionDetails = $derived($subscriptionDetailsStore ?? emptyDetails);
	    let loading = $derived(!$subscriptionLoaded || $subscriptionLoading);

	    onMount(async () => {
	        if (initialSubscriptionDetails) {
	            setSubscriptionDetails(initialSubscriptionDetails);
	            return;
	        }
	        await ensureSubscriptionDetailsLoaded();
	    });

    async function handleCheckout(productId: string) {
        try {
	            // Likely to change after returning from checkout; refetch next time.
	            resetSubscriptionDetails();
            await authClient.checkout({
                products: [productId],
            });
        } catch (error) {
            console.error("Checkout failed:", error);
            toast.error("Oops, something went wrong");
        }
    }

    async function handleManageSubscription() {
        try {
	            // Portal actions can change status; refetch on return.
	            resetSubscriptionDetails();
            await authClient.customer.portal();
        } catch (error) {
            console.error("Failed to open customer portal:", error);
            toast.error("Failed to open subscription management");
        }
    }

    function isCurrentPlan(tierProductId: string) {
        return (
            subscriptionDetails.hasSubscription &&
            subscriptionDetails.subscription?.productId === tierProductId &&
            subscriptionDetails.subscription?.status === "active"
        );
    }

	    function formatDate(date: Date | string) {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
</script>

<section class="mb-24 flex w-full flex-col items-center justify-center px-4">
    <div class="mb-12 text-center">
        <h1 class="mb-4 text-4xl font-medium tracking-tight">
            Fake Subscription
        </h1>
        <p class="text-muted-foreground text-xl">
            Test out this starter kit using this fake subscription.
        </p>
    </div>

    <div class="grid w-full max-w-4xl gap-8 md:grid-cols-2">
        <!-- Starter Tier -->
        <Card.Root class="relative h-fit">
            {#if isCurrentPlan(PUBLIC_STARTER_TIER)}
                <div
                    class="absolute -top-3 left-1/2 -translate-x-1/2 transform"
                >
                    <Badge
                        variant="secondary"
                        class="bg-green-100 text-green-800"
                    >
                        Current Plan
                    </Badge>
                </div>
            {/if}
            <Card.Header>
                <Card.Title class="text-2xl">Starter</Card.Title>
                <Card.Description>Perfect for getting started</Card.Description>
                <div class="mt-4">
                    <span class="text-4xl font-bold">$1,000</span>
                    <span class="text-muted-foreground">/month</span>
                </div>
            </Card.Header>
            <Card.Content class="space-y-4">
                <div class="flex items-center gap-3">
                    <Check class="h-5 w-5 text-green-500" />
                    <span>5 Projects</span>
                </div>
                <div class="flex items-center gap-3">
                    <Check class="h-5 w-5 text-green-500" />
                    <span>10GB Storage</span>
                </div>
                <div class="flex items-center gap-3">
                    <Check class="h-5 w-5 text-green-500" />
                    <span>1 Team Member</span>
                </div>
                <div class="flex items-center gap-3">
                    <Check class="h-5 w-5 text-green-500" />
                    <span>Email Support</span>
                </div>
            </Card.Content>
            <Card.Footer>
                {#if loading}
                    <Button class="w-full" disabled>
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </Button>
                {:else if isCurrentPlan(PUBLIC_STARTER_TIER)}
                    <div class="w-full space-y-2">
                        <Button
                            class="w-full"
                            variant="outline"
                            onclick={handleManageSubscription}
                        >
                            Manage Subscription
                        </Button>
                        {#if subscriptionDetails.subscription}
                            <p
                                class="text-muted-foreground text-center text-sm"
                            >
                                {subscriptionDetails.subscription
                                    .cancelAtPeriodEnd
                                    ? `Expires ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`
                                    : `Renews ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`}
                            </p>
                        {/if}
                    </div>
                {:else}
                    <GetStartedButton
                        class="w-full"
                        onclick={() => handleCheckout(PUBLIC_STARTER_TIER)}
                    >
                        Get Started
                    </GetStartedButton>
                {/if}
            </Card.Footer>
        </Card.Root>
    </div>

    <div class="mt-12 text-center">
        <p class="text-muted-foreground">
            Need a custom plan?
            <span class="text-primary cursor-pointer hover:underline">
                Contact us
            </span>
        </p>
    </div>
</section>
