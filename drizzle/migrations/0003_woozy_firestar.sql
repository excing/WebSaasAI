CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp NOT NULL,
	"modifiedAt" timestamp,
	"name" text NOT NULL,
	"description" text,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"recurringInterval" text,
	"organizationId" text NOT NULL,
	"prices" text NOT NULL,
	"benefits" text DEFAULT '[]' NOT NULL,
	"metadata" text
);
