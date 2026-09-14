CREATE TYPE "ador"."upload_content_type" AS ENUM('image/jpeg', 'image/png', 'image/webp');--> statement-breakpoint
CREATE TYPE "ador"."upload_intent_state" AS ENUM('reserved', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "ador"."upload_purpose" AS ENUM('collection-artwork', 'collection-banner', 'collection-item-artwork', 'creator-avatar');--> statement-breakpoint
CREATE TABLE "ador"."upload_intents" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"purpose" "ador"."upload_purpose" NOT NULL,
	"content_type" "ador"."upload_content_type" NOT NULL,
	"byte_length" bigint NOT NULL,
	"object_key" text NOT NULL UNIQUE,
	"state" "ador"."upload_intent_state" DEFAULT 'reserved'::"ador"."upload_intent_state" NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"cleanup_eligible_at" timestamp with time zone NOT NULL,
	"retain_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upload_intents_byte_length_positive" CHECK ("byte_length" > 0),
	CONSTRAINT "upload_intents_fingerprint_sha256" CHECK ("request_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "upload_intents_cleanup_after_expiry" CHECK ("cleanup_eligible_at" > "expires_at"),
	CONSTRAINT "upload_intents_retention_after_cleanup" CHECK ("retain_until" > "cleanup_eligible_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "upload_intents_user_idempotency_unique" ON "ador"."upload_intents" ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "upload_intents_active_user_idx" ON "ador"."upload_intents" ("user_id","state","expires_at");--> statement-breakpoint
ALTER TABLE "ador"."upload_intents" ADD CONSTRAINT "upload_intents_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;