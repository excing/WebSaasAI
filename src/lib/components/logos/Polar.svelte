<script lang="ts">
    let { class: className = "" } = $props();
</script>

<svg
    class={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width="1em"
    height="1em"
>
    <circle cx="50" cy="50" r="45" fill="#0062FF" />
    <text
        x="50"
        y="65"
        font-size="40"
        fill="white"
        text-anchor="middle"
        font-weight="bold">P</text
    >
</svg>
