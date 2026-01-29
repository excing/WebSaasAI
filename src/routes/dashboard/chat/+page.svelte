<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { cn } from "$lib/utils";
    import { Chat } from "@ai-sdk/svelte";

    const chat = new Chat({});

    let input = $state("");

    async function handleSubmit() {
        if (!input) return;
        await chat.sendMessage({ text: input });
        input = "";
    }
</script>

<div class="flex w-full flex-col items-center justify-center py-24">
    <div class="mb-20 w-full max-w-xl space-y-4">
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
            />
            <div class="flex w-full items-center justify-end gap-3">
                <Button size="sm" class="text-xs" type="submit">Send</Button>
            </div>
        </div>
    </form>
</div>
