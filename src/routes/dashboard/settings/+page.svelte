<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Tabs from "$lib/components/ui/tabs";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import * as Table from "$lib/components/ui/table";
    import { authClient } from "$lib/auth-client";
    import { Settings2, ExternalLink } from "lucide-svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import {
        authLoaded,
        currentUser,
        patchCurrentUser,
    } from "$lib/stores/auth";
    import { resetSubscriptionDetails } from "$lib/stores/subscription";

    interface User {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    }

    let user = $derived($currentUser as User | null);
    let loading = $derived(!$authLoaded);
    let currentTab = $state("profile");

    // Profile form states
    let name = $state("");
    let email = $state("");
    let didInitForm = $state(false);

    // Profile picture upload states
    let imagePreview = $state<string | null>(null);
    let uploadingImage = $state(false);

    // Orders states
    interface Order {
        id: string;
        productId: string;
        productName: string;
        status: string;
        paid: boolean;
        totalAmount: number;
        currency: string;
        createdAt: string;
        billingReason: string | null;
        invoiceNumber: string | null;
    }
    let orders = $state<Order[] | null>(null);
    let loadingOrders = $state(false);

    const tabParam = $derived($page.url.searchParams.get("tab"));

    $effect(() => {
        if (tabParam && ["profile", "billing"].includes(tabParam)) {
            currentTab = tabParam;
        }
    });

    $effect(() => {
        if (!$authLoaded || didInitForm) return;
        if ($currentUser) {
            name = ($currentUser as any)?.name || "";
            email = ($currentUser as any)?.email || "";
            didInitForm = true;
        }
    });

    function handleTabChange(value: string) {
        currentTab = value;
        const url = new URL(window.location.href);
        url.searchParams.set("tab", value);
        goto(url.pathname + url.search, { replaceState: true });
    }

    async function handleUpdateProfile() {
        try {
            await authClient.updateUser({ name });
            patchCurrentUser({ name });
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Failed to update profile");
        }
    }

    async function loadOrders() {
        if (loadingOrders) return;

        loadingOrders = true;
        try {
            const response = await fetch("/api/orders");
            if (!response.ok) {
                throw new Error("Failed to fetch orders");
            }
            const data = await response.json();
            orders = data.orders || [];
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Failed to load orders");
        } finally {
            loadingOrders = false;
        }
    }

    // Load orders when billing tab is activated
    $effect(() => {
        if (currentTab === "billing" && orders === null && !loadingOrders) {
            loadOrders();
        }
    });
</script>

{#if loading}
    <div class="flex flex-col gap-6 p-6">
        <div>
            <Skeleton class="mb-2 h-9 w-32 bg-gray-200 dark:bg-gray-800" />
            <Skeleton class="h-5 w-80 bg-gray-200 dark:bg-gray-800" />
        </div>
    </div>
{:else}
    <div class="flex flex-col gap-6 p-6">
        <div>
            <h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
            <p class="text-muted-foreground mt-2">
                Manage your account settings and preferences
            </p>
        </div>

        <Tabs.Root
            value={currentTab}
            onValueChange={handleTabChange}
            class="w-full max-w-4xl"
        >
            <Tabs.List>
                <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
                <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="profile" class="space-y-6">
                <Card.Root>
                    <Card.Header>
                        <Card.Title class="flex items-center gap-2">
                            <Settings2 class="h-5 w-5" />
                            Profile Information
                        </Card.Title>
                        <Card.Description>
                            Update your personal information and profile
                            settings
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-6">
                        <div class="flex items-center gap-4">
                            <Avatar.Root class="h-20 w-20">
                                {#if imagePreview || user?.image}
                                    <Avatar.Image
                                        src={imagePreview || user?.image || ""}
                                    />
                                {:else}
                                    <Avatar.Fallback>
                                        {name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </Avatar.Fallback>
                                {/if}
                            </Avatar.Root>
                            <div class="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage
                                        ? "Uploading..."
                                        : "Change Photo"}
                                </Button>
                                <p class="text-muted-foreground text-sm">
                                    JPG, GIF or PNG. 1MB max.
                                </p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="name">Full Name</Label>
                                <Input
                                    id="name"
                                    bind:value={name}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    bind:value={email}
                                    placeholder="Enter your email"
                                    disabled
                                />
                            </div>
                        </div>

                        <Button onclick={handleUpdateProfile}
                            >Save Changes</Button
                        >
                    </Card.Content>
                </Card.Root>
            </Tabs.Content>

            <Tabs.Content value="billing" class="space-y-6">
                <div class="mt-2 space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium">Billing History</h3>
                            <p class="text-muted-foreground text-sm">
                                View your past and upcoming invoices
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onclick={async () => {
                                try {
                                    resetSubscriptionDetails();
                                    await authClient.customer.portal();
                                } catch (error) {
                                    console.error(
                                        "Failed to open customer portal:",
                                        error,
                                    );
                                }
                            }}
                        >
                            <ExternalLink class="mr-2 h-4 w-4" />
                            Manage Subscription
                        </Button>
                    </div>

                    {#if loadingOrders}
                        <Card.Root>
                            <Card.Content class="p-6">
                                <div class="space-y-3">
                                    <Skeleton
                                        class="h-10 w-full bg-gray-200 dark:bg-gray-800"
                                    />
                                    <Skeleton
                                        class="h-10 w-full bg-gray-200 dark:bg-gray-800"
                                    />
                                    <Skeleton
                                        class="h-10 w-full bg-gray-200 dark:bg-gray-800"
                                    />
                                </div>
                            </Card.Content>
                        </Card.Root>
                    {:else if orders === null || orders.length === 0}
                        <Card.Root>
                            <Card.Content class="p-8 text-center">
                                <div
                                    class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                        class="text-muted-foreground mb-4 h-10 w-10"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                                        />
                                    </svg>
                                    <h3 class="mt-4 text-lg font-semibold">
                                        No orders found
                                    </h3>
                                    <p
                                        class="text-muted-foreground mb-4 mt-2 text-sm"
                                    >
                                        You don't have any orders yet. Your
                                        billing history will appear here.
                                    </p>
                                </div>
                            </Card.Content>
                        </Card.Root>
                    {:else}
                        <Card.Root>
                            <Card.Content class="p-0">
                                <Table.Root>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.Head>Order Number</Table.Head
                                            >
                                            <Table.Head>Product</Table.Head>
                                            <Table.Head>Status</Table.Head>
                                            <Table.Head>Amount</Table.Head>
                                            <Table.Head>Date</Table.Head>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {#each orders as order}
                                            <Table.Row>
                                                <Table.Cell
                                                    class="font-mono text-sm"
                                                >
                                                    {order.invoiceNumber ||
                                                        order.id.slice(0, 8)}
                                                </Table.Cell>
                                                <Table.Cell class="font-medium">
                                                    {order.productName}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <span
                                                        class="capitalize {order.paid
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-yellow-600 dark:text-yellow-400'}"
                                                    >
                                                        {order.status}
                                                    </span>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {(
                                                        order.totalAmount / 100
                                                    ).toFixed(2)}
                                                    {order.currency.toUpperCase()}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {new Date(
                                                        order.createdAt,
                                                    ).toLocaleDateString()}
                                                </Table.Cell>
                                            </Table.Row>
                                        {/each}
                                    </Table.Body>
                                </Table.Root>
                            </Card.Content>
                        </Card.Root>
                    {/if}
                </div>
            </Tabs.Content>
        </Tabs.Root>
    </div>
{/if}
