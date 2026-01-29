<script lang="ts">
    import SectionCards from "$lib/components/dashboard/SectionCards.svelte";
    import ChartInteractive from "$lib/components/dashboard/ChartInteractive.svelte";

    let { data } = $props();
</script>

<section class="flex w-full flex-col items-start justify-start p-6">
    <div class="w-full">
        <div class="flex flex-col items-start justify-center gap-2">
            <h1 class="text-3xl font-semibold tracking-tight">
                Interactive Chart
            </h1>
            <p class="text-muted-foreground">
                Interactive chart with data visualization and interactive
                elements.
            </p>
        </div>
        <div class="@container/main flex flex-1 flex-col gap-2">
            <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <ChartInteractive />
            </div>
        </div>
    </div>
</section>
