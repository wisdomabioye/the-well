CREATE TYPE "ador"."auth_security_action" AS ENUM('passkey-linked', 'passkey-unlinked');--> statement-breakpoint
CREATE TABLE "ador"."auth_security_events" (
	"id" uuid PRIMARY KEY,
	"action" "ador"."auth_security_action" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"credential_fingerprint" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_security_events_credential_fingerprint_sha256" CHECK ("credential_fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "ador"."passkey_challenges" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"challenge_hash" text NOT NULL,
	"origin" text NOT NULL,
	"relying_party_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"issued_at" timestamp with time zone NOT NULL,
	CONSTRAINT "passkey_challenges_hash_sha256" CHECK ("challenge_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "passkey_challenges_expiry_after_create" CHECK ("expires_at" > "issued_at")
);
--> statement-breakpoint
CREATE TABLE "ador"."passkey_credentials" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" bytea NOT NULL,
	"counter" bigint NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passkey_credentials_counter_nonnegative" CHECK ("counter" between 0 and 9007199254740991),
	CONSTRAINT "passkey_credentials_id_base64url" CHECK ("credential_id" ~ '^[A-Za-z0-9_-]+$'),
	CONSTRAINT "passkey_credentials_public_key_nonempty" CHECK (octet_length("public_key") > 0),
	CONSTRAINT "passkey_credentials_device_type_supported" CHECK ("device_type" in ('multiDevice', 'singleDevice'))
);
--> statement-breakpoint
ALTER TABLE "ador"."auth_sessions" ADD COLUMN "authenticated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_security_events_actor_created_idx" ON "ador"."auth_security_events" ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "passkey_challenges_expiry_idx" ON "ador"."passkey_challenges" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "passkey_credentials_credential_id_unique" ON "ador"."passkey_credentials" ("credential_id");--> statement-breakpoint
CREATE INDEX "passkey_credentials_user_id_idx" ON "ador"."passkey_credentials" ("user_id");--> statement-breakpoint
ALTER TABLE "ador"."auth_security_events" ADD CONSTRAINT "auth_security_events_actor_user_id_auth_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."auth_security_events" ADD CONSTRAINT "auth_security_events_session_id_auth_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ador"."auth_sessions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."passkey_challenges" ADD CONSTRAINT "passkey_challenges_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ador"."passkey_challenges" ADD CONSTRAINT "passkey_challenges_session_id_auth_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ador"."auth_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ador"."passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;