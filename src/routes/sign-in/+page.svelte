<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { authClient } from "$lib/auth-client";
    import { cn } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Loader2 } from "lucide-svelte";
    import { recordVerificationEmailSent } from "$lib/utils/verification";

    let loading = $state(false);
    let email = $state("");
    let password = $state("");
    const returnTo = $derived($page.url.searchParams.get("returnTo"));

    async function handleGoogleSignIn() {
        loading = true;
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: returnTo || "/dashboard",
            });
        } catch (error) {
            loading = false;
            console.error("Authentication error:", error);
            toast.error("登录失败，请重试");
        }
    }

    async function handleEmailSignIn(e: Event) {
        e.preventDefault();
        if (!email || !password) {
            toast.error("请输入邮箱和密码");
            return;
        }
        loading = true;
        try {
            const result = await authClient.signIn.email({
                email,
                password,
                callbackURL: returnTo || "/dashboard",
            });
            if (result.error) {
                if (result.error.status === 403) {
                    // 邮箱未验证，发送验证邮件并跳转
                    try {
                        await authClient.sendVerificationEmail({
                            email,
                            callbackURL: "/dashboard",
                        });
                        // 记录发送时间到 localStorage
                        recordVerificationEmailSent(email);
                        // 跳转到验证页面
                        goto(
                            `/verify-email?email=${encodeURIComponent(email)}`,
                        );
                    } catch (verifyError) {
                        console.error(
                            "Failed to send verification email:",
                            verifyError,
                        );
                    }
                } else {
                    toast.error(result.error.message || "登录失败");
                }
                loading = false;
            } else {
                goto(returnTo || "/dashboard");
            }
        } catch (error) {
            loading = false;
            console.error("Authentication error:", error);
            toast.error("登录失败，请检查邮箱和密码");
        }
    }
</script>

<div class="flex h-screen w-full flex-col items-center justify-center px-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title class="text-lg md:text-xl">欢迎回来</Card.Title>
            <Card.Description class="text-xs md:text-sm">
                使用邮箱或社交账号登录
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form class="grid gap-4" onsubmit={handleEmailSignIn}>
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
                <div class="grid gap-2">
                    <div class="flex items-center justify-between">
                        <Label for="password">密码</Label>
                        <a
                            href="/forgot-password"
                            class="text-xs text-muted-foreground hover:underline"
                        >
                            忘记密码?
                        </a>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        bind:value={password}
                        disabled={loading}
                        required
                    />
                </div>
                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    登录
                </Button>
            </form>

            <div class="relative my-4">
                <div class="absolute inset-0 flex items-center">
                    <span class="w-full border-t"></span>
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                    <span class="bg-background px-2 text-muted-foreground"
                        >或</span
                    >
                </div>
            </div>

            <div
                class={cn(
                    "flex w-full items-center gap-2",
                    "flex-col justify-between",
                )}
            >
                <Button
                    variant="outline"
                    class={cn("w-full gap-2")}
                    disabled={loading}
                    onclick={handleGoogleSignIn}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="0.98em"
                        height="1em"
                        viewBox="0 0 256 262"
                    >
                        <path
                            fill="#4285F4"
                            d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                        ></path>
                        <path
                            fill="#34A853"
                            d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                        ></path>
                        <path
                            fill="#FBBC05"
                            d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                        ></path>
                        <path
                            fill="#EB4335"
                            d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                        ></path>
                    </svg>
                    使用 Google 登录
                </Button>
            </div>
        </Card.Content>
        <Card.Footer class="flex justify-center">
            <p class="text-sm text-muted-foreground">
                还没有账号?
                <a href="/sign-up" class="text-primary hover:underline">
                    立即注册
                </a>
            </p>
        </Card.Footer>
    </Card.Root>
    <p
        class="mt-6 max-w-md text-center text-xs text-gray-500 dark:text-gray-400"
    >
        登录即表示您同意我们的
        <a
            href="/terms-of-service"
            class="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
            服务条款
        </a>
        和
        <a
            href="/privacy-policy"
            class="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
            隐私政策
        </a>
    </p>
</div>
