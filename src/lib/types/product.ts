// Shared product types that are safe to import from client or server code.

export type ProductPrice = {
    id: string;
    amountType: 'fixed' | 'free' | 'custom' | 'metered_unit' | 'seat_based';
    priceAmount?: number; // Price in cents
    priceCurrency?: string;
    recurringInterval?: string | null; // 'month' | 'year' | null
    isArchived?: boolean;
    type?: string;
};

export type ProductBenefit = {
    id: string;
    type: string;
    description: string;
};

export type ProductDetails = {
    id: string;
    name: string;
    description: string | null;
    isRecurring: boolean;
    isArchived: boolean;
    recurringInterval: string | null; // 'month' | 'year' | null for one-time
    organizationId: string;
    prices: ProductPrice[];
    benefits: ProductBenefit[];
    createdAt: Date | string;
    modifiedAt: Date | string | null;
};

export type ProductsResult = {
    products: ProductDetails[];
    error?: string;
};
