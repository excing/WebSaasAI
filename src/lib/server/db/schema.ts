import {
    boolean,
    integer,
    bigint,
    pgTable,
    text,
    timestamp
} from 'drizzle-orm/pg-core';

// Better Auth Tables
export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

// Subscription table for Polar webhook data
export const subscription = pgTable('subscription', {
    id: text('id').primaryKey(),
    createdAt: timestamp('createdAt').notNull(),
    modifiedAt: timestamp('modifiedAt'),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull(),
    recurringInterval: text('recurringInterval').notNull(),
    status: text('status').notNull(),
    currentPeriodStart: timestamp('currentPeriodStart').notNull(),
    currentPeriodEnd: timestamp('currentPeriodEnd').notNull(),
    cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').notNull().default(false),
    canceledAt: timestamp('canceledAt'),
    startedAt: timestamp('startedAt').notNull(),
    endsAt: timestamp('endsAt'),
    endedAt: timestamp('endedAt'),
    customerId: text('customerId').notNull(),
    productId: text('productId').notNull(),
    discountId: text('discountId'),
    checkoutId: text('checkoutId').notNull(),
    customerCancellationReason: text('customerCancellationReason'),
    customerCancellationComment: text('customerCancellationComment'),
    metadata: text('metadata'), // JSON string
    customFieldData: text('customFieldData'), // JSON string
    userId: text('userId').references(() => user.id)
});

// Order table for Polar one-time product purchases
export const order = pgTable('order', {
    id: text('id').primaryKey(),
    createdAt: timestamp('createdAt').notNull(),
    modifiedAt: timestamp('modifiedAt'),
    status: text('status').notNull(), // pending, paid, refunded, etc.
    paid: boolean('paid').notNull().default(false),
    subtotalAmount: integer('subtotalAmount').notNull(),
    discountAmount: integer('discountAmount').notNull().default(0),
    netAmount: integer('netAmount').notNull(),
    taxAmount: integer('taxAmount').notNull().default(0),
    totalAmount: integer('totalAmount').notNull(),
    refundedAmount: integer('refundedAmount').notNull().default(0),
    currency: text('currency').notNull(),
    billingReason: text('billingReason').notNull(), // purchase, subscription_cycle, etc.
    billingName: text('billingName'),
    invoiceNumber: text('invoiceNumber'),
    customerId: text('customerId').notNull(),
    productId: text('productId').notNull(),
    productName: text('productName').notNull(), // Product name from webhook data.product.name
    discountId: text('discountId'),
    subscriptionId: text('subscriptionId'),
    checkoutId: text('checkoutId'),
    metadata: text('metadata'), // JSON string
    userId: text('userId').references(() => user.id)
});

// Product table for Polar product data (synced via webhooks)
export const product = pgTable('product', {
    id: text('id').primaryKey(),
    createdAt: timestamp('createdAt').notNull(),
    modifiedAt: timestamp('modifiedAt'),
    name: text('name').notNull(),
    description: text('description'),
    isRecurring: boolean('isRecurring').notNull().default(false),
    isArchived: boolean('isArchived').notNull().default(false),
    recurringInterval: text('recurringInterval'), // 'month' | 'year' | null for one-time
    organizationId: text('organizationId').notNull(),
    prices: text('prices').notNull(), // JSON string of prices array
    benefits: text('benefits').notNull().default('[]'), // JSON string of benefits array
    metadata: text('metadata'), // JSON string
});

export const rateLimit = pgTable("rate_limit", {
    id: text("id").primaryKey(),
    key: text("key"),
    count: integer("count"),
    lastRequest: bigint("last_request", { mode: "number" }),
});

// Credit package table for managing user credits from subscriptions and one-time purchases
export const creditPackage = pgTable('credit_package', {
    id: text('id').primaryKey(),
    userId: text('userId')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    sourceType: text('sourceType').notNull(), // 'subscription' | 'order'
    sourceId: text('sourceId').notNull(), // subscription.id or order.id
    credits: integer('credits').notNull(), // Initial credit amount
    remainingCredits: integer('remainingCredits').notNull(), // Remaining credit amount
    validityPeriod: integer('validityPeriod'), // Validity period in days (optional)
    expiresAt: timestamp('expiresAt').notNull(), // Expiration timestamp
    status: text('status').notNull().default('active'), // 'active' | 'expired' | 'depleted'
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow()
});

// Credit transaction table for tracking credit consumption history
export const creditTransaction = pgTable('credit_transaction', {
    id: text('id').primaryKey(),
    userId: text('userId')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    packageId: text('packageId')
        .notNull()
        .references(() => creditPackage.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // Amount of credits consumed (positive number)
    type: text('type').notNull(), // 'chat' | 'image' | 'other'
    description: text('description'), // Optional description (e.g., "AI Chat - 1234 tokens")
    metadata: text('metadata'), // JSON string for additional data (e.g., token count, model used)
    createdAt: timestamp('createdAt').notNull().defaultNow()
});
