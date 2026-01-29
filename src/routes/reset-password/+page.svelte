<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Loader2, CheckCircle } from "lucide-svelte";

    let loading = $state(false);
    let password = $state("");
    let confirmPassword = $state("");
    let resetSuccess = $state(false);

    // 从 URL 获取 token
    const token = $derived($page.url.searchParams.get("token"));

    async function handleResetPassword(e: Event) {
        e.preventDefault();
        if (!password || !confirmPassword) {
            toast.error("请填写所有字段");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("两次输入的密码不一致");
            return;
        }
        if (password.length < 8) {
            toast.error("密码长度至少为 8 位");
            return;
        }
        if (!token) {
            toast.error("无效的重置链接");
            return;
        }
        loading = true;
        try {
            const result = await authClient.resetPassword({
                newPassword: password,
                token,
            });
            if (result.error) {
                toast.error(result.error.message || "重置密码失败");
            } else {
                resetSuccess = true;
                toast.success("密码已重置成功");
            }
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("重置密码失败，请重试");
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex h-screen w-full flex-col items-center justify-center px-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title class="text-lg md:text-xl">重置密码</Card.Title>
            <Card.Description class="text-xs md:text-sm">
                请输入您的新密码
            </Card.Description>
        </Card.Header>
        <Card.Content>
            {#if !token}
                <div class="flex flex-col items-center gap-4 py-4">
                    <p class="text-center text-muted-foreground">
                        无效或过期的重置链接。请重新请求重置密码。
                    </p>
                    <Button onclick={() => goto("/forgot-password")}>
                        重新请求
                    </Button>
                </div>
            {:else if resetSuccess}
                <div class="flex flex-col items-center gap-4 py-4">
                    <div
                        class="rounded-full bg-green-100 p-3 dark:bg-green-900"
                    >
                        <CheckCircle
                            class="h-6 w-6 text-green-600 dark:text-green-400"
                        />
                    </div>
                    <div class="text-center">
                        <p class="font-medium">密码重置成功</p>
                        <p class="mt-1 text-sm text-muted-foreground">
                            您现在可以使用新密码登录了。
                        </p>
                    </div>
                    <Button onclick={() => goto("/sign-in")}>前往登录</Button>
                </div>
            {:else}
                <form class="grid gap-4" onsubmit={handleResetPassword}>
                    <div class="grid gap-2">
                        <Label for="password">新密码</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="至少 8 位"
                            bind:value={password}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="confirmPassword">确认新密码</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="再次输入新密码"
                            bind:value={confirmPassword}
                            disabled={loading}
                            required
                        />
                    </div>
                    <Button type="submit" class="w-full" disabled={loading}>
                        {#if loading}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        {/if}
                        重置密码
                    </Button>
                </form>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
