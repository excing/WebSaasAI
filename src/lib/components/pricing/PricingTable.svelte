<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import GetStartedButton from "$lib/components/common/GetStartedButton.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { authClient } from "$lib/auth-client";
    import { Check, Loader2 } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    import type { SubscriptionDetailsResult } from "$lib/types/subscription";
    import type { ProductDetails, ProductsResult } from "$lib/types/product";
    import {
        ensureSubscriptionDetailsLoaded,
        resetSubscriptionDetails,
        setSubscriptionDetails,
        subscriptionDetails as subscriptionDetailsStore,
        subscriptionLoaded,
        subscriptionLoading,
    } from "$lib/stores/subscription";
    import {
        ensureProductsLoaded,
        productsData as productsDataStore,
        productsLoaded,
        productsLoading,
    } from "$lib/stores/products";

    interface Props {
        subscriptionDetails?: SubscriptionDetailsResult;
        products?: ProductsResult;
    }

    let { subscriptionDetails: initialSubscriptionDetails, products: initialProducts }: Props = $props();

    const emptyDetails: SubscriptionDetailsResult = { hasSubscription: false };
    const emptyProducts: ProductsResult = { products: [] };
    let subscriptionDetails = $derived($subscriptionDetailsStore ?? emptyDetails);
    let productsData = $derived($productsDataStore ?? emptyProducts);
    let loading = $derived(!$subscriptionLoaded || $subscriptionLoading || !$productsLoaded || $productsLoading);

    // Separate products into subscription and one-time
    let subscriptionProducts = $derived(productsData.products.filter((p) => p.isRecurring));
    let oneTimeProducts = $derived(productsData.products.filter((p) => !p.isRecurring));

    onMount(async () => {
        if (initialSubscriptionDetails) {
            setSubscriptionDetails(initialSubscriptionDetails);
        } else {
            await ensureSubscriptionDetailsLoaded();
        }
        await ensureProductsLoaded();
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

    function formatPrice(product: ProductDetails): { amount: string; interval: string | null } {
        // Get the first non-archived price
        const price = product.prices.find((p) => !p.isArchived);
        if (!price) return { amount: "Contact us", interval: null };

        if (price.amountType === "free") {
            return { amount: "Free", interval: null };
        }

        if (price.amountType === "custom") {
            return { amount: "Custom pricing", interval: null };
        }

        if (price.priceAmount !== undefined && price.priceCurrency) {
            const formatter = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: price.priceCurrency.toUpperCase(),
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
            const amount = formatter.format(price.priceAmount / 100);

            if (product.isRecurring && product.recurringInterval) {
                return { amount, interval: `/${product.recurringInterval}` };
            }
            return { amount, interval: null };
        }

        return { amount: "Contact us", interval: null };
    }
</script>

<section class="mb-24 flex w-full flex-col items-center justify-center px-4">
    <div class="mb-12 text-center">
        <h1 class="mb-4 text-4xl font-medium tracking-tight">
            Choose Your Plan
        </h1>
        <p class="text-muted-foreground text-xl">
            Select the plan that best fits your needs.
        </p>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    {:else if productsData.products.length === 0}
        <div class="text-center py-12">
            <p class="text-muted-foreground text-lg">No products available at the moment.</p>
        </div>
    {:else}
        <!-- Subscription Products -->
        {#if subscriptionProducts.length > 0}
            <div class="mb-8 w-full max-w-6xl">
                {#if oneTimeProducts.length > 0}
                    <h2 class="text-2xl font-semibold mb-6 text-center">Subscription Plans</h2>
                {/if}
                <div class="grid w-full gap-8 {subscriptionProducts.length === 1 ? 'max-w-md mx-auto' : subscriptionProducts.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}">
                    {#each subscriptionProducts as product (product.id)}
                        {@const priceInfo = formatPrice(product)}
                        <Card.Root class="relative h-fit">
                            {#if isCurrentPlan(product.id)}
                                <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                                    <Badge variant="secondary" class="bg-green-100 text-green-800">
                                        Current Plan
                                    </Badge>
                                </div>
                            {/if}
                            <Card.Header>
                                <Card.Title class="text-2xl">{product.name}</Card.Title>
                                {#if product.description}
                                    <Card.Description>{product.description}</Card.Description>
                                {/if}
                                <div class="mt-4">
                                    <span class="text-4xl font-bold">{priceInfo.amount}</span>
                                    {#if priceInfo.interval}
                                        <span class="text-muted-foreground">{priceInfo.interval}</span>
                                    {/if}
                                </div>
                            </Card.Header>
                            <Card.Content class="space-y-4">
                                {#each product.benefits as benefit (benefit.id)}
                                    <div class="flex items-center gap-3">
                                        <Check class="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span>{benefit.description}</span>
                                    </div>
                                {/each}
                                {#if product.benefits.length === 0}
                                    <p class="text-muted-foreground text-sm">Contact us for details</p>
                                {/if}
                            </Card.Content>
                            <Card.Footer>
                                {#if isCurrentPlan(product.id)}
                                    <div class="w-full space-y-2">
                                        <Button
                                            class="w-full"
                                            variant="outline"
                                            onclick={handleManageSubscription}
                                        >
                                            Manage Subscription
                                        </Button>
                                        {#if subscriptionDetails.subscription}
                                            <p class="text-muted-foreground text-center text-sm">
                                                {subscriptionDetails.subscription.cancelAtPeriodEnd
                                                    ? `Expires ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`
                                                    : `Renews ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`}
                                            </p>
                                        {/if}
                                    </div>
                                {:else}
                                    <GetStartedButton
                                        class="w-full"
                                        onclick={() => handleCheckout(product.id)}
                                    >
                                        Get Started
                                    </GetStartedButton>
                                {/if}
                            </Card.Footer>
                        </Card.Root>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- One-Time Products -->
        {#if oneTimeProducts.length > 0}
            <div class="w-full max-w-6xl">
                {#if subscriptionProducts.length > 0}
                    <h2 class="text-2xl font-semibold mb-6 text-center">One-Time Purchases</h2>
                {/if}
                <div class="grid w-full gap-8 {oneTimeProducts.length === 1 ? 'max-w-md mx-auto' : oneTimeProducts.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}">
                    {#each oneTimeProducts as product (product.id)}
                        {@const priceInfo = formatPrice(product)}
                        <Card.Root class="relative h-fit">
                            <Card.Header>
                                <Card.Title class="text-2xl">{product.name}</Card.Title>
                                {#if product.description}
                                    <Card.Description>{product.description}</Card.Description>
                                {/if}
                                <div class="mt-4">
                                    <span class="text-4xl font-bold">{priceInfo.amount}</span>
                                    {#if priceInfo.interval}
                                        <span class="text-muted-foreground">{priceInfo.interval}</span>
                                    {/if}
                                </div>
                            </Card.Header>
                            <Card.Content class="space-y-4">
                                {#each product.benefits as benefit (benefit.id)}
                                    <div class="flex items-center gap-3">
                                        <Check class="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span>{benefit.description}</span>
                                    </div>
                                {/each}
                                {#if product.benefits.length === 0}
                                    <p class="text-muted-foreground text-sm">Contact us for details</p>
                                {/if}
                            </Card.Content>
                            <Card.Footer>
                                <GetStartedButton
                                    class="w-full"
                                    onclick={() => handleCheckout(product.id)}
                                >
                                    Buy Now
                                </GetStartedButton>
                            </Card.Footer>
                        </Card.Root>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}

    <div class="mt-12 text-center">
        <p class="text-muted-foreground">
            Need a custom plan?
            <span class="text-primary cursor-pointer hover:underline">
                Contact us
            </span>
        </p>
    </div>
</section>
