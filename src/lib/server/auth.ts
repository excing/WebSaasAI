import { db } from '$lib/server/db';
import { account, session, subscription, order, user, verification, rateLimit, product, creditPackage } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from '$env/dynamic/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import { Resend } from 'resend';

const POLAR_ENVIRONMENT = (env.POLAR_ENVIRONMENT as 'sandbox' | 'production' | undefined) || 'sandbox';
const POLAR_ACCESS_TOKEN = env.POLAR_ACCESS_TOKEN!;
const POLAR_WEBHOOK_SECRET = env.POLAR_WEBHOOK_SECRET!;
const POLAR_SUCCESS_URL = env.POLAR_SUCCESS_URL || `/success?checkout_id={CHECKOUT_ID}`;
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET!;
const RESEND_API_KEY = env.RESEND_API_KEY!;
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@example.com';

const resend = new Resend(RESEND_API_KEY);

// Utility function to safely parse dates
function safeParseDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
}

/**
 * Parse credits from various formats
 * @param creditsRaw - Credits value (number or string like "0100", "1000")
 * @returns Parsed credits as number, or null if invalid
 * @example
 * parseCredits(100) // 100
 * parseCredits("0100") // 100
 * parseCredits("1000") // 1000
 */
function parseCredits(creditsRaw: unknown): number | null {
    if (!creditsRaw) return null;

    if (typeof creditsRaw === 'number') {
        return creditsRaw;
    }

    if (typeof creditsRaw === 'string') {
        const parsed = parseInt(creditsRaw, 10);
        return isNaN(parsed) ? null : parsed;
    }

    return null;
}

/**
 * Parse validity period and calculate expiration date
 * @param validityPeriodRaw - Validity period (number in days, or string like "3m", "1y", "30d")
 * @param fallbackDate - Optional fallback date if no validity period specified
 * @returns Object with expiresAt date and validityPeriodDays (approximate)
 * @example
 * parseValidityPeriod("3m") // { expiresAt: Date (3 months later), validityPeriodDays: 90 }
 * parseValidityPeriod("1y") // { expiresAt: Date (1 year later), validityPeriodDays: 365 }
 * parseValidityPeriod("30") // { expiresAt: Date (30 days later), validityPeriodDays: 30 }
 * parseValidityPeriod(30) // { expiresAt: Date (30 days later), validityPeriodDays: 30 }
 */
function parseValidityPeriod(
    validityPeriodRaw: unknown,
    fallbackDate?: Date
): { expiresAt: Date; validityPeriodDays: number | null } {
    let expiresAt: Date = new Date();
    let validityPeriodDays: number | null = null;

    if (validityPeriodRaw) {
        if (typeof validityPeriodRaw === 'number') {
            // If it's a number, treat as days
            validityPeriodDays = validityPeriodRaw;
            expiresAt.setDate(expiresAt.getDate() + validityPeriodRaw);
        } else if (typeof validityPeriodRaw === 'string') {
            // Parse string format: "3m", "1y", "30d", "30"
            const match = validityPeriodRaw.match(/^(\d+)([myd]?)$/i);
            if (match) {
                const value = parseInt(match[1], 10);
                const unit = match[2]?.toLowerCase() || 'd';

                if (unit === 'm') {
                    // Natural months
                    expiresAt.setMonth(expiresAt.getMonth() + value);
                    validityPeriodDays = value * 30; // Approximate for storage
                } else if (unit === 'y') {
                    // Natural years
                    expiresAt.setFullYear(expiresAt.getFullYear() + value);
                    validityPeriodDays = value * 365; // Approximate for storage
                } else {
                    // Days
                    expiresAt.setDate(expiresAt.getDate() + value);
                    validityPeriodDays = value;
                }
            }
        }
    } else if (fallbackDate) {
        // Use fallback date if provided
        expiresAt = fallbackDate;
    } else {
        // Default to 1 natural year if no validity period specified
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        validityPeriodDays = 365;
    }

    return { expiresAt, validityPeriodDays };
}

const polarClient = new Polar({
    accessToken: POLAR_ACCESS_TOKEN,
    server: POLAR_ENVIRONMENT
});

export const auth = betterAuth({
    trustedOrigins: [PUBLIC_APP_URL],
    allowedDevOrigins: [PUBLIC_APP_URL],
    cookieCache: {
        enabled: true,
        maxAge: 5 * 60 // Cache duration in seconds
    },
    rateLimit: {
        enabled: true, // 生产环境默认开启，开发环境需手动开启进行测试
        window: 60, // 默认 60 秒窗口
        max: 100,   // 默认最多 100 次请求
        storage: "database", // 使用数据库存储，适合 serverless 环境
        // modelName: "rateLimit", //optional by default "rateLimit" is used
        customRules: {
            "/send-verification-email": {
                window: 90, // 发送验证邮件：90 秒窗口
                max: 1      // 最多 1 次请求
            }
        }
    },
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user,
            session,
            account,
            verification,
            subscription,
            order,
            rateLimit
        }
    }),
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            console.log('Sending reset password email to:', user.email);
            const result = await resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: user.email,
                subject: '重置密码 - SvelteKit Starter Kit',
                html: `
                    <h2>重置密码</h2>
                    <p>您好 ${user.name}，</p>
                    <p>点击下面的链接重置您的密码：</p>
                    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:white;text-decoration:none;border-radius:6px;">重置密码</a>
                    <p>如果您没有请求重置密码，请忽略此邮件。</p>
                `,
            });
            if (result.error) {
                console.error('Failed to send reset password email:', result.error);
                throw new Error(result.error.message);
            }
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            console.log('Sending verification email to:', user.email);
            const result = await resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: user.email,
                subject: '验证您的邮箱 - SvelteKit Starter Kit',
                html: `
                    <h2>验证邮箱</h2>
                    <p>您好 ${user.name}，</p>
                    <p>点击下面的链接验证您的邮箱：</p>
                    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:white;text-decoration:none;border-radius:6px;">验证邮箱</a>
                `,
            });
            if (result.error) {
                console.error('Failed to send verification email:', result.error);
                throw new Error(result.error.message);
            }
        },
    },
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    successUrl: `${PUBLIC_APP_URL}${POLAR_SUCCESS_URL}`,
                    authenticatedUsersOnly: true
                }),
                portal(),
                usage(),
                webhooks({
                    secret: POLAR_WEBHOOK_SECRET,
                    onPayload: async ({ data, type }) => {
                        if (
                            type === 'subscription.created' ||
                            type === 'subscription.active' ||
                            type === 'subscription.canceled' ||
                            type === 'subscription.revoked' ||
                            type === 'subscription.uncanceled' ||
                            type === 'subscription.updated'
                        ) {
                            console.log('🎯 Processing subscription webhook:', type);
                            console.log('📦 Payload data:', JSON.stringify(data, null, 2));

                            try {
                                // STEP 1: Extract user ID from customer data
                                const userId = data.customer?.externalId;
                                // STEP 2: Build subscription data
                                const subscriptionData = {
                                    id: data.id,
                                    createdAt: new Date(data.createdAt),
                                    modifiedAt: safeParseDate(data.modifiedAt),
                                    amount: data.amount,
                                    currency: data.currency,
                                    recurringInterval: data.recurringInterval,
                                    status: data.status,
                                    currentPeriodStart: safeParseDate(data.currentPeriodStart) || new Date(),
                                    currentPeriodEnd: safeParseDate(data.currentPeriodEnd) || new Date(),
                                    cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                                    canceledAt: safeParseDate(data.canceledAt),
                                    startedAt: safeParseDate(data.startedAt) || new Date(),
                                    endsAt: safeParseDate(data.endsAt),
                                    endedAt: safeParseDate(data.endedAt),
                                    customerId: data.customerId,
                                    productId: data.productId,
                                    discountId: data.discountId || null,
                                    checkoutId: data.checkoutId || '',
                                    customerCancellationReason: data.customerCancellationReason || null,
                                    customerCancellationComment: data.customerCancellationComment || null,
                                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                                    customFieldData: data.customFieldData
                                        ? JSON.stringify(data.customFieldData)
                                        : null,
                                    userId: userId as string | null
                                };

                                console.log('💾 Final subscription data:', {
                                    id: subscriptionData.id,
                                    status: subscriptionData.status,
                                    userId: subscriptionData.userId,
                                    amount: subscriptionData.amount
                                });

                                // STEP 3: Use Drizzle's onConflictDoUpdate for proper upsert
                                await db
                                    .insert(subscription)
                                    .values(subscriptionData)
                                    .onConflictDoUpdate({
                                        target: subscription.id,
                                        set: {
                                            modifiedAt: subscriptionData.modifiedAt || new Date(),
                                            amount: subscriptionData.amount,
                                            currency: subscriptionData.currency,
                                            recurringInterval: subscriptionData.recurringInterval,
                                            status: subscriptionData.status,
                                            currentPeriodStart: subscriptionData.currentPeriodStart,
                                            currentPeriodEnd: subscriptionData.currentPeriodEnd,
                                            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                                            canceledAt: subscriptionData.canceledAt,
                                            startedAt: subscriptionData.startedAt,
                                            endsAt: subscriptionData.endsAt,
                                            endedAt: subscriptionData.endedAt,
                                            customerId: subscriptionData.customerId,
                                            productId: subscriptionData.productId,
                                            discountId: subscriptionData.discountId,
                                            checkoutId: subscriptionData.checkoutId,
                                            customerCancellationReason: subscriptionData.customerCancellationReason,
                                            customerCancellationComment: subscriptionData.customerCancellationComment,
                                            metadata: subscriptionData.metadata,
                                            customFieldData: subscriptionData.customFieldData,
                                            userId: subscriptionData.userId
                                        }
                                    });

                                console.log('✅ Upserted subscription:', data.id);

                                // STEP 4: Handle credit package creation/update from metadata
                                // Try subscription metadata first, then fall back to product metadata
                                const metadataSource = data.metadata || data.product?.metadata;
                                if (userId && metadataSource) {
                                    try {
                                        const metadata = typeof metadataSource === 'string'
                                            ? JSON.parse(metadataSource)
                                            : metadataSource;

                                        const credits = parseCredits(metadata.credits);

                                        // For subscriptions, always use currentPeriodEnd as expiration
                                        // Ignore validity_period from metadata as subscriptions renew automatically
                                        const expiresAt = subscriptionData.currentPeriodEnd;
                                        const validityPeriodDays = null; // Not applicable for subscriptions

                                        if (credits && credits > 0) {
                                            console.log('💳 Processing credit package for subscription:', {
                                                subscriptionId: data.id,
                                                eventType: type,
                                                status: data.status,
                                                credits,
                                                expiresAt: expiresAt.toISOString(),
                                                currentPeriodStart: subscriptionData.currentPeriodStart.toISOString(),
                                                currentPeriodEnd: subscriptionData.currentPeriodEnd.toISOString(),
                                                rawCredits: metadata.credits
                                            });

                                            // Check if credit package already exists for this subscription
                                            const existingPackages = await db
                                                .select()
                                                .from(creditPackage)
                                                .where(eq(creditPackage.sourceId, data.id))
                                                .limit(1);

                                            const existingPackage = existingPackages[0];

                                            // Determine if this is a renewal (currentPeriodStart changed)
                                            let isRenewal = false;
                                            if (existingPackage) {
                                                // Get the previous subscription data to compare currentPeriodStart
                                                const previousSubscriptions = await db
                                                    .select()
                                                    .from(subscription)
                                                    .where(eq(subscription.id, data.id))
                                                    .limit(1);

                                                if (previousSubscriptions.length > 0) {
                                                    const prevSub = previousSubscriptions[0];
                                                    // Check if currentPeriodStart has changed (indicates renewal)
                                                    isRenewal = prevSub.currentPeriodStart.getTime() !== subscriptionData.currentPeriodStart.getTime();
                                                }
                                            }

                                            // Determine action based on event type and subscription status
                                            const shouldResetCredits =
                                                type === 'subscription.created' ||
                                                (type === 'subscription.active' && !existingPackage) ||
                                                (type === 'subscription.updated' && isRenewal) ||
                                                type === 'subscription.uncanceled';

                                            const shouldDeactivate =
                                                type === 'subscription.canceled' ||
                                                type === 'subscription.revoked';

                                            if (existingPackage) {
                                                // Update existing package
                                                const updateData: any = {
                                                    expiresAt,
                                                    validityPeriod: validityPeriodDays,
                                                    updatedAt: new Date()
                                                };

                                                // Reset credits only on renewal or uncancellation
                                                if (shouldResetCredits) {
                                                    updateData.credits = credits;
                                                    updateData.remainingCredits = credits;
                                                    updateData.status = 'active';
                                                    console.log('🔄 Resetting credits for subscription:', data.id, 'Reason:', type, isRenewal ? '(renewal)' : '');
                                                } else if (shouldDeactivate) {
                                                    // Don't reset credits on cancellation, just keep current state
                                                    // The package will expire naturally at currentPeriodEnd
                                                    console.log('⏸️  Subscription canceled/revoked, keeping current credits until expiration:', data.id);
                                                } else {
                                                    // For other updates (e.g., metadata changes), update credit amount if changed
                                                    // but preserve remaining credits proportionally
                                                    if (existingPackage.credits !== credits) {
                                                        console.log('📊 Credit amount changed (upgrade/downgrade):', {
                                                            old: existingPackage.credits,
                                                            new: credits,
                                                            remaining: existingPackage.remainingCredits
                                                        });
                                                        updateData.credits = credits;
                                                        // Preserve remaining credits, but cap at new credit limit
                                                        updateData.remainingCredits = Math.min(existingPackage.remainingCredits, credits);
                                                    }
                                                }

                                                await db
                                                    .update(creditPackage)
                                                    .set(updateData)
                                                    .where(eq(creditPackage.sourceId, data.id));

                                                console.log('✅ Updated credit package for subscription:', data.id);
                                            } else {
                                                // Create new package
                                                const creditPackageId = `cp_sub_${data.id}_${Date.now()}`;
                                                await db.insert(creditPackage).values({
                                                    id: creditPackageId,
                                                    userId: userId as string,
                                                    sourceType: 'subscription',
                                                    sourceId: data.id,
                                                    credits,
                                                    remainingCredits: credits,
                                                    validityPeriod: validityPeriodDays,
                                                    expiresAt,
                                                    status: 'active'
                                                });

                                                console.log('✅ Created credit package:', creditPackageId);
                                            }
                                        }
                                    } catch (creditError) {
                                        console.error('💥 Error processing credit package for subscription:', creditError);
                                        // Don't throw - let webhook succeed
                                    }
                                }
                            } catch (error) {
                                console.error('💥 Error processing subscription webhook:', error);
                                // Don't throw - let webhook succeed to avoid retries
                            }
                        }

                        // Handle order events for one-time product purchases
                        if (
                            type === 'order.created' ||
                            type === 'order.paid' ||
                            type === 'order.updated'
                        ) {
                            console.log('🎯 Processing order webhook:', type);
                            console.log('📦 Payload data:', JSON.stringify(data, null, 2));

                            try {
                                const userId = data.customer?.externalId;

                                // Ensure required fields are present
                                if (!data.productId) {
                                    console.error('💥 Order webhook missing productId:', data.id);
                                    return;
                                }

                                const orderData = {
                                    id: data.id,
                                    createdAt: new Date(data.createdAt),
                                    modifiedAt: safeParseDate(data.modifiedAt),
                                    status: data.status,
                                    paid: data.paid || false,
                                    subtotalAmount: data.subtotalAmount,
                                    discountAmount: data.discountAmount || 0,
                                    netAmount: data.netAmount,
                                    taxAmount: data.taxAmount || 0,
                                    totalAmount: data.totalAmount,
                                    refundedAmount: data.refundedAmount || 0,
                                    currency: data.currency,
                                    billingReason: data.billingReason,
                                    billingName: data.billingName || null,
                                    invoiceNumber: data.invoiceNumber || null,
                                    customerId: data.customerId,
                                    productId: data.productId,
                                    productName: data.product?.name || 'Unknown Product',
                                    discountId: data.discountId || null,
                                    subscriptionId: data.subscriptionId || null,
                                    checkoutId: data.checkoutId || null,
                                    // Use product metadata if order metadata is empty
                                    metadata: (data.metadata && Object.keys(data.metadata).length > 0)
                                        ? JSON.stringify(data.metadata)
                                        : (data.product?.metadata ? JSON.stringify(data.product.metadata) : null),
                                    userId: userId as string | null
                                };

                                console.log('💾 Final order data:', {
                                    id: orderData.id,
                                    status: orderData.status,
                                    productName: orderData.productName,
                                    userId: orderData.userId,
                                    totalAmount: orderData.totalAmount
                                });

                                await db
                                    .insert(order)
                                    .values(orderData)
                                    .onConflictDoUpdate({
                                        target: order.id,
                                        set: {
                                            modifiedAt: orderData.modifiedAt || new Date(),
                                            status: orderData.status,
                                            paid: orderData.paid,
                                            subtotalAmount: orderData.subtotalAmount,
                                            discountAmount: orderData.discountAmount,
                                            netAmount: orderData.netAmount,
                                            taxAmount: orderData.taxAmount,
                                            totalAmount: orderData.totalAmount,
                                            refundedAmount: orderData.refundedAmount,
                                            currency: orderData.currency,
                                            billingReason: orderData.billingReason,
                                            billingName: orderData.billingName,
                                            invoiceNumber: orderData.invoiceNumber,
                                            customerId: orderData.customerId,
                                            productId: orderData.productId,
                                            productName: orderData.productName,
                                            discountId: orderData.discountId,
                                            subscriptionId: orderData.subscriptionId,
                                            checkoutId: orderData.checkoutId,
                                            metadata: orderData.metadata,
                                            userId: orderData.userId
                                        }
                                    });

                                console.log('✅ Upserted order:', data.id);

                                // STEP 4: Handle credit package creation from product metadata for one-time purchases ONLY
                                // Skip orders that are part of a subscription (subscriptionId is present)
                                if (userId && data.product?.metadata && data.paid && !data.subscriptionId) {
                                    try {
                                        const metadata = typeof data.product.metadata === 'string'
                                            ? JSON.parse(data.product.metadata)
                                            : data.product.metadata;

                                        const credits = parseCredits(metadata.credits);
                                        const { expiresAt, validityPeriodDays } = parseValidityPeriod(
                                            metadata.validity_period
                                        );

                                        if (credits && credits > 0) {
                                            console.log('💳 Creating credit package for one-time order:', {
                                                orderId: data.id,
                                                credits,
                                                validityPeriodDays,
                                                expiresAt: expiresAt.toISOString(),
                                                rawCredits: metadata.credits,
                                                rawValidityPeriod: metadata.validity_period
                                            });

                                            // Generate unique ID for credit package
                                            const creditPackageId = `cp_ord_${data.id}_${Date.now()}`;

                                            // Check if credit package already exists for this order
                                            const existingPackage = await db
                                                .select()
                                                .from(creditPackage)
                                                .where(eq(creditPackage.sourceId, data.id))
                                                .limit(1);

                                            if (existingPackage.length > 0) {
                                                // Update existing package
                                                await db
                                                    .update(creditPackage)
                                                    .set({
                                                        credits,
                                                        expiresAt,
                                                        validityPeriod: validityPeriodDays,
                                                        updatedAt: new Date()
                                                    })
                                                    .where(eq(creditPackage.sourceId, data.id));

                                                console.log('✅ Updated credit package for order:', data.id);
                                            } else {
                                                // Create new package (only for paid orders)
                                                await db.insert(creditPackage).values({
                                                    id: creditPackageId,
                                                    userId: userId as string,
                                                    sourceType: 'order',
                                                    sourceId: data.id,
                                                    credits,
                                                    remainingCredits: credits,
                                                    validityPeriod: validityPeriodDays,
                                                    expiresAt,
                                                    status: 'active'
                                                });

                                                console.log('✅ Created credit package:', creditPackageId);
                                            }
                                        }
                                    } catch (creditError) {
                                        console.error('💥 Error processing credit package for order:', creditError);
                                        // Don't throw - let webhook succeed
                                    }
                                }
                            } catch (error) {
                                console.error('💥 Error processing order webhook:', error);
                            }
                        }

                        // Handle product events for product sync
                        if (
                            type === 'product.created' ||
                            type === 'product.updated'
                        ) {
                            console.log('🎯 Processing product webhook:', type);
                            console.log('📦 Payload data:', JSON.stringify(data, null, 2));

                            try {
                                // Extract price info from prices array
                                const prices = data.prices?.map((p: {
                                    id: string;
                                    amountType: string;
                                    priceAmount?: number;
                                    priceCurrency?: string;
                                    recurringInterval?: string | null;
                                    isArchived?: boolean;
                                    type?: string;
                                }) => ({
                                    id: p.id,
                                    amountType: p.amountType,
                                    priceAmount: p.priceAmount,
                                    priceCurrency: p.priceCurrency,
                                    recurringInterval: p.recurringInterval,
                                    isArchived: p.isArchived,
                                    type: p.type,
                                })) || [];

                                // Extract benefit info from benefits array
                                const benefits = data.benefits?.map((b: {
                                    id: string;
                                    type: string;
                                    description: string;
                                }) => ({
                                    id: b.id,
                                    type: b.type,
                                    description: b.description,
                                })) || [];

                                const productData = {
                                    id: data.id,
                                    createdAt: new Date(data.createdAt),
                                    modifiedAt: safeParseDate(data.modifiedAt),
                                    name: data.name,
                                    description: data.description || null,
                                    isRecurring: data.isRecurring || false,
                                    isArchived: data.isArchived || false,
                                    recurringInterval: data.recurringInterval || null,
                                    organizationId: data.organizationId,
                                    prices: JSON.stringify(prices),
                                    benefits: JSON.stringify(benefits),
                                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                                };

                                console.log('💾 Final product data:', {
                                    id: productData.id,
                                    name: productData.name,
                                    isRecurring: productData.isRecurring,
                                    isArchived: productData.isArchived,
                                    pricesCount: prices.length,
                                    benefitsCount: benefits.length,
                                });

                                await db
                                    .insert(product)
                                    .values(productData)
                                    .onConflictDoUpdate({
                                        target: product.id,
                                        set: {
                                            modifiedAt: productData.modifiedAt || new Date(),
                                            name: productData.name,
                                            description: productData.description,
                                            isRecurring: productData.isRecurring,
                                            isArchived: productData.isArchived,
                                            recurringInterval: productData.recurringInterval,
                                            organizationId: productData.organizationId,
                                            prices: productData.prices,
                                            benefits: productData.benefits,
                                            metadata: productData.metadata,
                                        }
                                    });

                                console.log('✅ Upserted product:', data.id);
                            } catch (error) {
                                console.error('💥 Error processing product webhook:', error);
                            }
                        }
                    }
                })
            ]
        })
    ],
});

export type Session = typeof auth.$Infer.Session;
