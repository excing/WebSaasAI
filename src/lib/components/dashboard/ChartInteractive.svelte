<script lang="ts">
    import * as Card from "$lib/components/ui/card";

    // 简化版图表，使用纯 CSS 实现
    const data = [
        { month: "Jan", value: 186 },
        { month: "Feb", value: 305 },
        { month: "Mar", value: 237 },
        { month: "Apr", value: 273 },
        { month: "May", value: 209 },
        { month: "Jun", value: 314 },
    ];

    const maxValue = Math.max(...data.map((d) => d.value));
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Overview</Card.Title>
        <Card.Description>Monthly visitor statistics</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="flex h-[300px] items-end justify-between gap-2">
            {#each data as item}
                <div class="flex flex-1 flex-col items-center gap-2">
                    <div
                        class="bg-primary w-full rounded-t-md transition-all hover:opacity-80"
                        style="height: {(item.value / maxValue) * 250}px"
                    ></div>
                    <span class="text-muted-foreground text-xs"
                        >{item.month}</span
                    >
                </div>
            {/each}
        </div>
    </Card.Content>
</Card.Root>
