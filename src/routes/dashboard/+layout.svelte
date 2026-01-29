<script lang="ts">
    import Sidebar from "$lib/components/dashboard/Sidebar.svelte";
    import Navbar from "$lib/components/dashboard/Navbar.svelte";

    let { children } = $props();
</script>

<div class="flex h-screen w-full overflow-hidden">
    <Sidebar />
    <main class="flex-1 overflow-y-auto">
        <Navbar>
            {@render children()}
        </Navbar>
    </main>
</div>
