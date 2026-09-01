CREATE TYPE "ador"."outbox_status" AS ENUM('pending', 'delivering', 'delivered', 'failed');--> statement-breakpoint
CREATE TABLE "ador"."outbox_events" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"causation_id" uuid,
	"correlation_id" uuid NOT NULL,
	"delivered_at" timestamp with time zone,
	"event_id" uuid PRIMARY KEY,
	"event_name" text NOT NULL,
	"failure_reason" text,
	"lease_expires_at" timestamp with time zone,
	"lease_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"schema_version" integer NOT NULL,
	"status" "ador"."outbox_status" DEFAULT 'pending'::"ador"."outbox_status" NOT NULL,
	CONSTRAINT "outbox_attempts_nonnegative" CHECK ("attempts" >= 0),
	CONSTRAINT "outbox_delivery_lease_consistent" CHECK (("status" = 'delivering') = ("lease_id" is not null and "lease_expires_at" is not null)),
	CONSTRAINT "outbox_delivered_time_consistent" CHECK (("status" = 'delivered') = ("delivered_at" is not null)),
	CONSTRAINT "outbox_failed_reason_required" CHECK ("status" <> 'failed' or length(btrim("failure_reason")) > 0),
	CONSTRAINT "outbox_name_version_consistent" CHECK ("event_name" ~ ('\.v' || "schema_version" || '$')),
	CONSTRAINT "outbox_schema_version_positive" CHECK ("schema_version" > 0)
);
--> statement-breakpoint
CREATE INDEX "outbox_delivery_candidates" ON "ador"."outbox_events" ("status","available_at");