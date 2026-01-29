<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";
    import { Loader2, ArrowLeft, Mail } from "lucide-svelte";

    let loading = $state(false);
    let email = $state("");
    let emailSent = $state(false);

    async function handleResetPassword(e: Event) {
        e.preventDefault();
        if (!email) {
            toast.error("请输入邮箱地址");
            return;
        }
        loading = true;
        try {
            const { data, error } = await authClient.requestPasswordReset({
                email,
                redirectTo: "/reset-password",
            });
            if (error) {
                toast.error(error.message || "发送失败");
            } else {
                emailSent = true;
                toast.success("重置密码链接已发送到您的邮箱");
            }
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("发送失败，请重试");
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex h-screen w-full flex-col items-center justify-center px-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title class="text-lg md:text-xl">忘记密码</Card.Title>
            <Card.Description class="text-xs md:text-sm">
                输入您的邮箱，我们将发送重置密码链接
            </Card.Description>
        </Card.Header>
        <Card.Content>
            {#if !emailSent}
                <form class="grid gap-4" onsubmit={handleResetPassword}>
                    <div class="grid gap-2">
                        <Label for="email">邮箱</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            bind:value={email}
                            disabled={loading}
                            required
                        />
                    </div>
                    <Button type="submit" class="w-full" disabled={loading}>
                        {#if loading}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        {/if}
                        发送重置链接
                    </Button>
                </form>
            {:else}
                <div class="flex flex-col items-center gap-4 py-4">
                    <div
                        class="rounded-full bg-green-100 p-3 dark:bg-green-900"
                    >
                        <Mail
                            class="h-6 w-6 text-green-600 dark:text-green-400"
                        />
                    </div>
                    <div class="text-center">
                        <p class="font-medium">邮件已发送</p>
                        <p class="mt-1 text-sm text-muted-foreground">
                            请检查您的邮箱 {email}，点击邮件中的链接重置密码。
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        class="mt-2"
                        onclick={() => {
                            emailSent = false;
                            email = "";
                        }}
                    >
                        使用其他邮箱
                    </Button>
                </div>
            {/if}
        </Card.Content>
        <Card.Footer class="flex justify-center">
            <a
                href="/sign-in"
                class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft class="h-4 w-4" />
                返回登录
            </a>
        </Card.Footer>
    </Card.Root>
</div>
