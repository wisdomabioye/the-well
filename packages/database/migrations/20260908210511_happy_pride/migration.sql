CREATE TYPE "ador"."auth_challenge_action" AS ENUM('sign-in', 'link-wallet', 'step-up');--> statement-breakpoint
CREATE TABLE "ador"."auth_sessions" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_idle_before_absolute" CHECK ("idle_expires_at" <= "absolute_expires_at"),
	CONSTRAINT "auth_sessions_token_hash_sha256" CHECK ("token_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "ador"."auth_users" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ador"."wallet_challenges" (
	"id" uuid PRIMARY KEY,
	"expected_user_id" uuid,
	"action" "ador"."auth_challenge_action" NOT NULL,
	"address" text NOT NULL,
	"script_identity" text NOT NULL,
	"network" text NOT NULL,
	"domain" text NOT NULL,
	"origin" text NOT NULL,
	"uri" text NOT NULL,
	"wallet_adapter" text NOT NULL,
	"signature_scheme" text NOT NULL,
	"nonce" text NOT NULL,
	"request_id" uuid NOT NULL,
	"message_hash" text NOT NULL,
	"schema_version" integer NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "wallet_challenges_attempts_nonnegative" CHECK ("attempts" >= 0),
	CONSTRAINT "wallet_challenges_expiry_after_issue" CHECK ("expires_at" > "issued_at"),
	CONSTRAINT "wallet_challenges_network_supported" CHECK ("network" in ('mainnet', 'signet')),
	CONSTRAINT "wallet_challenges_signature_scheme_supported" CHECK ("signature_scheme" = 'bip322-simple'),
	CONSTRAINT "wallet_challenges_schema_version_supported" CHECK ("schema_version" = 1),
	CONSTRAINT "wallet_challenges_message_hash_sha256" CHECK ("message_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "ador"."wallet_identities" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"network" text NOT NULL,
	"address" text NOT NULL,
	"script_identity" text NOT NULL,
	"wallet_adapter" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_identities_network_supported" CHECK ("network" in ('mainnet', 'signet')),
	CONSTRAINT "wallet_identities_adapter_nonempty" CHECK (length("wallet_adapter") > 0 and "wallet_adapter" = btrim("wallet_adapter"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "ador"."auth_sessions" ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "ador"."auth_sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_challenges_nonce_unique" ON "ador"."wallet_challenges" ("nonce");--> statement-breakpoint
CREATE INDEX "wallet_challenges_expiry_idx" ON "ador"."wallet_challenges" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_identities_network_script_unique" ON "ador"."wallet_identities" ("network","script_identity");--> statement-breakpoint
CREATE INDEX "wallet_identities_user_id_idx" ON "ador"."wallet_identities" ("user_id");--> statement-breakpoint
ALTER TABLE "ador"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ador"."wallet_challenges" ADD CONSTRAINT "wallet_challenges_expected_user_id_auth_users_id_fkey" FOREIGN KEY ("expected_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ador"."wallet_identities" ADD CONSTRAINT "wallet_identities_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;