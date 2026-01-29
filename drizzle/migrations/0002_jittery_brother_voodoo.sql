CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp NOT NULL,
	"modifiedAt" timestamp,
	"status" text NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"subtotalAmount" integer NOT NULL,
	"discountAmount" integer DEFAULT 0 NOT NULL,
	"netAmount" integer NOT NULL,
	"taxAmount" integer DEFAULT 0 NOT NULL,
	"totalAmount" integer NOT NULL,
	"refundedAmount" integer DEFAULT 0 NOT NULL,
	"currency" text NOT NULL,
	"billingReason" text NOT NULL,
	"billingName" text,
	"invoiceNumber" text,
	"customerId" text NOT NULL,
	"productId" text NOT NULL,
	"productName" text NOT NULL,
	"discountId" text,
	"subscriptionId" text,
	"checkoutId" text,
	"metadata" text,
	"userId" text
);
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;