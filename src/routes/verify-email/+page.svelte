<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";
    import { page } from "$app/stores";
    import { onDestroy } from "svelte";
    import { Loader2, Mail } from "lucide-svelte";
    import {
        recordVerificationEmailSent,
        getRemainingWaitTime,
    } from "$lib/utils/verification";

    let email = $state("");
    let loading = $state(false);
    let remainingSeconds = $state(0);
    let intervalId: number | null = null;

    // 从 URL 参数获取邮箱
    $effect(() => {
        const emailParam = $page.url.searchParams.get("email");
        if (emailParam) {
            email = emailParam;
            // 从 localStorage 恢复倒计时
            loadRemainingTime();
        }
    });

    // 从 localStorage 加载剩余时间
    function loadRemainingTime() {
        if (!email) return;

        const remaining = getRemainingWaitTime(email);

        if (remaining > 0) {
            remainingSeconds = remaining;
            startCountdown();
        }
    }

    // 开始倒计时
    function startCountdown() {
        if (intervalId) {
            clearInterval(intervalId);
        }

        intervalId = window.setInterval(() => {
            if (remainingSeconds > 0) {
                remainingSeconds--;
            } else {
                stopCountdown();
            }
        }, 1000);
    }

    // 停止倒计时
    function stopCountdown() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // 重新发送验证邮件
    async function handleResendEmail() {
        if (!email) {
            toast.error("邮箱地址缺失");
            return;
        }

        if (remainingSeconds > 0) {
            toast.error(`请等待 ${remainingSeconds} 秒后再试`);
            return;
        }

        loading = true;
        try {
            await authClient.sendVerificationEmail({
                email,
                callbackURL: "/dashboard",
                fetchOptions: {
                    onError: async (context) => {
                        if (context.response.status === 429) {
                            const retryAfter =
                                context.response.headers.get("X-Retry-After");
                            const retrySeconds = retryAfter
                                ? parseInt(retryAfter, 10)
                                : 90;
                            remainingSeconds = retrySeconds;
                            startCountdown();
                            toast.error(
                                `发送过于频繁，请等待 ${retrySeconds} 秒`,
                            );
                        }
                    },
                },
            });

            // 记录发送时间
            recordVerificationEmailSent(email);

            // 开始 90 秒倒计时
            remainingSeconds = 90;
            startCountdown();

            toast.success("验证邮件已重新发送，请查收邮箱");
        } catch (error) {
            console.error("Resend verification email error:", error);
            toast.error("发送失败，请稍后重试");
        } finally {
            loading = false;
        }
    }

    // 清理定时器
    onDestroy(() => {
        stopCountdown();
    });
</script>

<div class="flex h-screen w-full flex-col items-center justify-center px-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <div class="flex justify-center mb-4">
                <div class="rounded-full bg-primary/10 p-3">
                    <Mail class="h-6 w-6 text-primary" />
                </div>
            </div>
            <Card.Title class="text-center text-lg md:text-xl"
                >验证您的邮箱</Card.Title
            >
            <Card.Description class="text-center text-xs md:text-sm">
                我们已向 <strong>{email}</strong> 发送了一封验证邮件
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="rounded-lg border bg-muted/50 p-4 text-sm">
                <p class="mb-2">请按照以下步骤完成验证：</p>
                <ol
                    class="list-decimal list-inside space-y-1 text-muted-foreground"
                >
                    <li>打开您的邮箱</li>
                    <li>查找来自我们的验证邮件</li>
                    <li>点击邮件中的验证链接</li>
                </ol>
            </div>

            <div class="text-center">
                <p class="text-sm text-muted-foreground mb-3">没有收到邮件？</p>
                <Button
                    onclick={handleResendEmail}
                    variant="outline"
                    class="w-full"
                    disabled={loading || remainingSeconds > 0}
                >
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    {#if remainingSeconds > 0}
                        重新发送 ({remainingSeconds}s)
                    {:else}
                        重新发送验证邮件
                    {/if}
                </Button>
            </div>

            <div class="text-center text-xs text-muted-foreground">
                <p>提示：请检查垃圾邮件文件夹</p>
            </div>
        </Card.Content>
    </Card.Root>
</div>
