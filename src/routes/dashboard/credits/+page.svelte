<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Coins, Package, Clock, TrendingUp, ShoppingCart } from "lucide-svelte";
    import { goto } from "$app/navigation";

    interface CreditPackage {
        id: string;
        sourceType: "subscription" | "order";
        sourceId: string;
        credits: number;
        remainingCredits: number;
        validityPeriod: number | null;
        expiresAt: string;
        status: "active" | "expired" | "depleted";
        createdAt: string;
    }

    interface CreditTransaction {
        id: string;
        packageId: string;
        amount: number;
        type: "chat" | "image" | "other";
        description: string | null;
        metadata: string | null;
        createdAt: string;
    }

    let totalCredits = $state(0);
    let packages: CreditPackage[] = $state([]);
    let transactions: CreditTransaction[] = $state([]);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        await Promise.all([fetchCredits(), fetchTransactions()]);
        loading = false;
    });

    async function fetchCredits() {
        try {
            const response = await fetch("/api/credits");
            const result = await response.json();

            if (result.success) {
                totalCredits = result.data.totalCredits;
                packages = result.data.packages;
            } else {
                error = result.error || "Failed to fetch credits";
            }
        } catch (err) {
            error = "Failed to fetch credits";
            console.error(err);
        }
    }

    async function fetchTransactions() {
        try {
            const response = await fetch("/api/credits/transactions?limit=20");
            const result = await response.json();

            if (result.success) {
                transactions = result.data;
            }
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatExpiryDate(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const daysLeft = Math.ceil(
            (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysLeft < 0) {
            return "已过期";
        } else if (daysLeft === 0) {
            return "今天过期";
        } else if (daysLeft <= 7) {
            return `${daysLeft} 天后过期`;
        } else {
            return date.toLocaleDateString("zh-CN");
        }
    }

    function getSourceTypeLabel(type: string) {
        return type === "subscription" ? "订阅" : "购买";
    }

    function getTransactionTypeLabel(type: string) {
        switch (type) {
            case "chat":
                return "AI 对话";
            case "image":
                return "图片处理";
            default:
                return "其他";
        }
    }

    function parseMetadata(metadata: string | null) {
        if (!metadata) return null;
        try {
            return JSON.parse(metadata);
        } catch {
            return null;
        }
    }
</script>

<div class="container mx-auto max-w-6xl space-y-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold">我的积分</h1>
            <p class="mt-2 text-muted-foreground">
                管理您的积分余额和消费记录
            </p>
        </div>
        <Button onclick={() => goto("/pricing")}>
            <ShoppingCart class="mr-2 h-4 w-4" />
            购买积分
        </Button>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="text-muted-foreground">加载中...</div>
        </div>
    {:else if error}
        <Card class="p-6">
            <div class="text-center text-destructive">{error}</div>
        </Card>
    {:else}
        <!-- Total Credits Card -->
        <Card class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 dark:from-blue-950 dark:to-indigo-950">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Coins class="h-4 w-4" />
                        <span>总积分余额</span>
                    </div>
                    <div class="mt-2 text-5xl font-bold">{totalCredits.toLocaleString()}</div>
                    <p class="mt-2 text-sm text-muted-foreground">
                        约可进行 {Math.floor(totalCredits / 10)} 次 AI 对话
                    </p>
                </div>
                <div class="rounded-full bg-blue-100 p-6 dark:bg-blue-900">
                    <TrendingUp class="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </Card>

        <!-- Credit Packages -->
        <div>
            <h2 class="mb-4 text-xl font-semibold">积分包</h2>
            {#if packages.length === 0}
                <Card class="p-8 text-center">
                    <Package class="mx-auto h-12 w-12 text-muted-foreground" />
                    <p class="mt-4 text-muted-foreground">
                        您还没有任何积分包
                    </p>
                    <Button class="mt-4" onclick={() => goto("/pricing")}>
                        立即购买
                    </Button>
                </Card>
            {:else}
                <div class="grid gap-4 md:grid-cols-2">
                    {#each packages as pkg}
                        <Card class="p-6">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {getSourceTypeLabel(pkg.sourceType)}
                                        </Badge>
                                        <Badge
                                            variant={pkg.status === "active"
                                                ? "default"
                                                : "secondary"}
                                        >
                                            {pkg.status === "active"
                                                ? "活跃"
                                                : pkg.status === "expired"
                                                  ? "已过期"
                                                  : "已用完"}
                                        </Badge>
                                    </div>
                                    <div class="mt-4">
                                        <div class="text-2xl font-bold">
                                            {pkg.remainingCredits.toLocaleString()}
                                            <span class="text-sm font-normal text-muted-foreground">
                                                / {pkg.credits.toLocaleString()}
                                            </span>
                                        </div>
                                        <div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                                            <div
                                                class="h-full bg-primary transition-all"
                                                style="width: {(pkg.remainingCredits /
                                                    pkg.credits) *
                                                    100}%"
                                            ></div>
                                        </div>
                                    </div>
                                    <div class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock class="h-4 w-4" />
                                        <span>{formatExpiryDate(pkg.expiresAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Transaction History -->
        <div>
            <h2 class="mb-4 text-xl font-semibold">消费记录</h2>
            {#if transactions.length === 0}
                <Card class="p-8 text-center">
                    <p class="text-muted-foreground">暂无消费记录</p>
                </Card>
            {:else}
                <Card>
                    <div class="divide-y">
                        {#each transactions as tx}
                            {@const metadata = parseMetadata(tx.metadata)}
                            <div class="flex items-center justify-between p-4">
                                <div class="flex-1">
                                    <div class="font-medium">
                                        {getTransactionTypeLabel(tx.type)}
                                    </div>
                                    <div class="mt-1 text-sm text-muted-foreground">
                                        {tx.description || "无描述"}
                                    </div>
                                    {#if metadata}
                                        <div class="mt-1 text-xs text-muted-foreground">
                                            {#if metadata.totalTokens}
                                                {metadata.totalTokens.toLocaleString()} tokens
                                            {/if}
                                            {#if metadata.model}
                                                · {metadata.model}
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold text-destructive">
                                        -{tx.amount}
                                    </div>
                                    <div class="mt-1 text-xs text-muted-foreground">
                                        {formatDate(tx.createdAt)}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </Card>
            {/if}
        </div>
    {/if}
</div>
