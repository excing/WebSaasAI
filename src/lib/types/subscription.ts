// Shared subscription types that are safe to import from client or server code.

export type SubscriptionDetails = {
	id: string;
	productId: string;
	status: string;
	amount: number;
	currency: string;
	recurringInterval: string;
	// Over the wire (JSON) these will typically be strings.
	currentPeriodStart: Date | string;
	currentPeriodEnd: Date | string;
	cancelAtPeriodEnd: boolean;
	canceledAt: Date | string | null;
	organizationId: string | null;
};

export type SubscriptionDetailsResult = {
	hasSubscription: boolean;
	subscription?: SubscriptionDetails;
	error?: string;
	errorType?: 'CANCELED' | 'EXPIRED' | 'GENERAL';
};
