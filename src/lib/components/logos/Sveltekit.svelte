<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";

    let { class: className = "" } = $props();
</script>

<img src={favicon} alt="SvelteKit Logo" class={className} />
