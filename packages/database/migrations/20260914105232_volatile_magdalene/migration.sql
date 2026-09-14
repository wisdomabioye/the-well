CREATE TYPE "ador"."asset_processing_state" AS ENUM('pending-validation');--> statement-breakpoint
CREATE TABLE "ador"."assets" (
	"id" uuid PRIMARY KEY,
	"upload_intent_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_provider_id" text NOT NULL,
	"object_key" text NOT NULL,
	"observed_byte_length" bigint NOT NULL,
	"observed_content_type" text NOT NULL,
	"observed_entity_tag" text NOT NULL,
	"observed_last_modified_at" timestamp with time zone NOT NULL,
	"processing_state" "ador"."asset_processing_state" DEFAULT 'pending-validation'::"ador"."asset_processing_state" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_observed_bytes_positive" CHECK ("observed_byte_length" > 0),
	CONSTRAINT "assets_storage_provider_nonempty" CHECK (length(btrim("storage_provider_id")) > 0),
	CONSTRAINT "assets_object_key_nonempty" CHECK (length("object_key") > 0),
	CONSTRAINT "assets_content_type_nonempty" CHECK (length(btrim("observed_content_type")) > 0),
	CONSTRAINT "assets_entity_tag_nonempty" CHECK (length(btrim("observed_entity_tag")) > 0)
);
--> statement-breakpoint
ALTER TABLE "ador"."upload_intents" ADD COLUMN "storage_provider_id" text DEFAULT 'r2-object-storage' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "assets_upload_intent_unique" ON "ador"."assets" ("upload_intent_id");--> statement-breakpoint
CREATE INDEX "assets_user_created_idx" ON "ador"."assets" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "ador"."assets" ADD CONSTRAINT "assets_upload_intent_id_upload_intents_id_fkey" FOREIGN KEY ("upload_intent_id") REFERENCES "ador"."upload_intents"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."assets" ADD CONSTRAINT "assets_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."upload_intents" ADD CONSTRAINT "upload_intents_storage_provider_nonempty" CHECK (length(btrim("storage_provider_id")) > 0);