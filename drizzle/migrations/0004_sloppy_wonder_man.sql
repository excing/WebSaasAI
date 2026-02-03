CREATE TABLE "credit_package" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"sourceType" text NOT NULL,
	"sourceId" text NOT NULL,
	"credits" integer NOT NULL,
	"remainingCredits" integer NOT NULL,
	"validityPeriod" integer,
	"expiresAt" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_package" ADD CONSTRAINT "credit_package_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;