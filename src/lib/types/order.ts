// Shared order types that are safe to import from client or server code.

export type OrderDetails = {
    id: string;
    productId: string;
    productName: string;
    status: string;
    paid: boolean;
    totalAmount: number;
    currency: string;
    createdAt: Date | string;
    billingReason: string;
    invoiceNumber: string | null;
};

export type OrderListResult = {
    orders: OrderDetails[];
    error?: string;
};
