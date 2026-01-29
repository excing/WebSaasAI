<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import {
        TrendingUp,
        TrendingDown,
        Users,
        DollarSign,
        Activity,
        CreditCard,
    } from "lucide-svelte";

    const cards = [
        {
            title: "Total Revenue",
            value: "$45,231.89",
            change: "+20.1%",
            trending: "up",
            icon: DollarSign,
        },
        {
            title: "Subscriptions",
            value: "+2,350",
            change: "+180.1%",
            trending: "up",
            icon: Users,
        },
        {
            title: "Sales",
            value: "+12,234",
            change: "+19%",
            trending: "up",
            icon: CreditCard,
        },
        {
            title: "Active Now",
            value: "+573",
            change: "+201",
            trending: "up",
            icon: Activity,
        },
    ];
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each cards as card}
        <Card.Root>
            <Card.Header
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <Card.Title class="text-sm font-medium">{card.title}</Card.Title
                >
                <card.icon class="text-muted-foreground h-4 w-4" />
            </Card.Header>
            <Card.Content>
                <div class="text-2xl font-bold">{card.value}</div>
                <div class="text-muted-foreground flex items-center text-xs">
                    {#if card.trending === "up"}
                        <TrendingUp class="mr-1 h-3 w-3 text-green-500" />
                    {:else}
                        <TrendingDown class="mr-1 h-3 w-3 text-red-500" />
                    {/if}
                    <span
                        class={card.trending === "up"
                            ? "text-green-500"
                            : "text-red-500"}
                    >
                        {card.change}
                    </span>
                    <span class="ml-1">from last month</span>
                </div>
            </Card.Content>
        </Card.Root>
    {/each}
</div>
