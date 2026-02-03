<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Badge } from "$lib/components/ui/badge";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
    import { cn } from "$lib/utils";
    import { Chat } from "@ai-sdk/svelte";
    import { Coins, AlertCircle } from "lucide-svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    const chat = new Chat({});

    let input = $state("");
    let totalCredits = $state(0);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        await fetchCredits();
        loading = false;
    });

    async function fetchCredits() {
        try {
            const response = await fetch("/api/credits");
            const result = await response.json();

            if (result.success) {
                totalCredits = result.data.totalCredits;
            } else {
                error = result.error || "Failed to fetch credits";
            }
        } catch (err) {
            console.error("Failed to fetch credits:", err);
        }
    }

    async function handleSubmit() {
        if (!input) return;

        // Check credits before sending
        if (totalCredits <= 0) {
            error = "积分不足，请购买积分包后继续使用";
            return;
        }

        try {
            await chat.sendMessage({ text: input });
            input = "";
            // Refresh credits after message is sent
            await fetchCredits();
        } catch (err: any) {
            if (err?.message?.includes("Insufficient credits") || err?.status === 402) {
                error = "积分不足，请购买积分包后继续使用";
                await fetchCredits();
            } else {
                error = "发送消息失败，请重试";
            }
        }
    }
</script>

<div class="flex w-full flex-col items-center justify-center py-24">
    <!-- Credits Display -->
    <div class="fixed left-0 right-0 top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container flex h-14 items-center justify-center">
            <button
                onclick={() => goto("/dashboard/credits")}
                class="flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-accent"
            >
                <Coins class="h-4 w-4 text-primary" />
                <span class="text-sm font-medium">
                    {loading ? "..." : totalCredits.toLocaleString()}
                </span>
                <Badge variant={totalCredits > 100 ? "default" : totalCredits > 0 ? "secondary" : "destructive"}>
                    积分
                </Badge>
            </button>
        </div>
    </div>

    <div class="mb-20 mt-14 w-full max-w-xl space-y-4">
        <!-- Error Alert -->
        {#if error}
            <Alert variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <AlertDescription class="flex items-center justify-between">
                    <span>{error}</span>
                    {#if totalCredits <= 0}
                        <Button size="sm" variant="outline" onclick={() => goto("/pricing")}>
                            购买积分
                        </Button>
                    {/if}
                </AlertDescription>
            </Alert>
        {/if}
        {#each chat.messages as message}
            <div
                class={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                )}
            >
                <div
                    class={cn(
                        "max-w-[65%] px-3 py-1.5 text-sm shadow-sm",
                        message.role === "user"
                            ? "rounded-2xl rounded-br-sm bg-[#0B93F6] text-white"
                            : "rounded-2xl rounded-bl-sm bg-[#E9E9EB] text-black",
                    )}
                >
                    {#each message.parts as part}
                        {#if part.type === "text"}
                            <div
                                class="prose-sm prose-p:my-0.5 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1"
                            >
                                {part.text}
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    <form
        class="fixed bottom-0 flex w-full items-center justify-center gap-2"
        onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}
    >
        <div
            class="mb-8 flex w-full max-w-xl flex-col items-start justify-center gap-2 rounded-lg border bg-white p-2"
        >
            <Input
                class="w-full border-0 shadow-none !ring-transparent"
                bind:value={input}
                placeholder="Say something..."
                disabled={totalCredits <= 0}
            />
            <div class="flex w-full items-center justify-end gap-3">
                <Button
                    size="sm"
                    class="text-xs"
                    type="submit"
                    disabled={totalCredits <= 0 || !input}
                >
                    {totalCredits <= 0 ? "积分不足" : "Send"}
                </Button>
            </div>
        </div>
    </form>
</div>
