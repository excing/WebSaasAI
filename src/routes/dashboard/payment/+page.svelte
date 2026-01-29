<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { onMount } from "svelte";
	    import type { SubscriptionDetailsResult } from "$lib/types/subscription";
	    import {
	        ensureSubscriptionDetailsLoaded,
	        subscriptionDetails as subscriptionDetailsStore,
	        subscriptionLoaded,
	        subscriptionLoading,
	    } from "$lib/stores/subscription";

	    const emptyDetails: SubscriptionDetailsResult = { hasSubscription: false };
	    let subscriptionDetails = $derived($subscriptionDetailsStore ?? emptyDetails);
	    let loading = $derived(!$subscriptionLoaded || $subscriptionLoading);

    onMount(async () => {
	        await ensureSubscriptionDetailsLoaded();
    });
</script>

<div>
    <div class="space-y-4 p-6">
        <div class="relative min-h-screen">
            {#if loading}
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p class="text-muted-foreground">Loading subscription details...</p>
                    </div>
                </div>
            {:else if !subscriptionDetails.hasSubscription || subscriptionDetails.subscription?.status !== "active"}
                <div
                    class="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
                >
                    <div
                        class="max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-900"
                    >
                        <h3 class="mb-2 text-xl font-semibold">
                            Subscription Required
                        </h3>
                        <p class="text-muted-foreground mb-4">
                            You need an active subscription to access payment
                            management features.
                        </p>
                        <a href="/pricing">
                            <Button>Subscribe Now</Button>
                        </a>
                    </div>
                </div>
                <div class="pointer-events-none blur-sm">
                    <Card.Root>
                        <Card.Header>
                            <Card.Title>Payment Management</Card.Title>
                            <Card.Description
                                >Manage your billing and payment methods</Card.Description
                            >
                        </Card.Header>
                        <Card.Content class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p
                                        class="text-muted-foreground text-sm font-medium"
                                    >
                                        Current Plan
                                    </p>
                                    <p class="text-md">Pro Plan</p>
                                </div>
                                <div>
                                    <p
                                        class="text-muted-foreground text-sm font-medium"
                                    >
                                        Billing Status
                                    </p>
                                    <p class="text-md">Active</p>
                                </div>
                            </div>
                        </Card.Content>
                    </Card.Root>
                </div>
            {:else}
                <Card.Root>
                    <Card.Header>
                        <Card.Title>Subscription Details</Card.Title>
                        <Card.Description
                            >Your current subscription information</Card.Description
                        >
                    </Card.Header>
                    <Card.Content class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p
                                    class="text-muted-foreground text-sm font-semibold"
                                >
                                    Status
                                </p>
                                <p class="text-md capitalize">
                                    {subscriptionDetails.subscription.status}
                                </p>
                            </div>
                            <div>
                                <p
                                    class="text-muted-foreground text-sm font-semibold"
                                >
                                    Amount
                                </p>
                                <p class="text-md">
                                    {subscriptionDetails.subscription.amount /
                                        100}
                                    {subscriptionDetails.subscription.currency.toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <p
                                    class="text-muted-foreground text-sm font-semibold"
                                >
                                    Billing Interval
                                </p>
                                <p class="text-md capitalize">
                                    {subscriptionDetails.subscription
                                        .recurringInterval}
                                </p>
                            </div>
                            <div>
                                <p
                                    class="text-muted-foreground text-sm font-semibold"
                                >
                                    Current Period End
                                </p>
                                <p class="text-md">
                                    {new Date(
                                        subscriptionDetails.subscription.currentPeriodEnd,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {#if subscriptionDetails.subscription.cancelAtPeriodEnd}
                            <div
                                class="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                            >
                                <p class="text-sm text-yellow-800">
                                    Your subscription will cancel at the end of
                                    the current billing period.
                                </p>
                            </div>
                        {/if}
                    </Card.Content>
                </Card.Root>
            {/if}
        </div>
    </div>
</div>
