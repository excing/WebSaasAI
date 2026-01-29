import { db } from '$lib/server/db';
import { account, session, subscription, order, user, verification, rateLimit } from '$lib/server/db/schema';
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
                                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
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
                            } catch (error) {
                                console.error('💥 Error processing order webhook:', error);
                            }
                        }
                    }
                })
            ]
        })
    ],
});

export type Session = typeof auth.$Infer.Session;
