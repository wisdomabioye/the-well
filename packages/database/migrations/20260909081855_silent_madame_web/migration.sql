CREATE TYPE "ador"."creator_admission_action" AS ENUM('save-draft', 'submit', 'start-review', 'approve', 'request-changes', 'reject', 'resubmit', 'suspend', 'reinstate', 'revoke');--> statement-breakpoint
CREATE TYPE "ador"."creator_application_state" AS ENUM('draft', 'submitted', 'under-review', 'approved', 'changes-requested', 'rejected', 'suspended', 'revoked');--> statement-breakpoint
CREATE TABLE "ador"."creator_admission_events" (
	"id" uuid PRIMARY KEY,
	"application_id" uuid NOT NULL,
	"snapshot_id" uuid,
	"actor_user_id" uuid NOT NULL,
	"action" "ador"."creator_admission_action" NOT NULL,
	"previous_state" "ador"."creator_application_state" NOT NULL,
	"next_state" "ador"."creator_application_state" NOT NULL,
	"reason_code" text NOT NULL,
	"creator_feedback" text DEFAULT '' NOT NULL,
	"private_notes" text DEFAULT '' NOT NULL,
	"evidence_references" jsonb DEFAULT '[]' NOT NULL,
	"policy_version" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_events_reason_code_valid" CHECK ("reason_code" ~ '^[a-z][a-z0-9-]{2,63}$')
);
--> statement-breakpoint
CREATE TABLE "ador"."creator_application_snapshots" (
	"id" uuid PRIMARY KEY,
	"application_id" uuid NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"schema_version" integer NOT NULL,
	"verified_contact_email" text NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_snapshots_sequence_positive" CHECK ("sequence" > 0),
	CONSTRAINT "creator_snapshots_hash_sha256" CHECK ("payload_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "ador"."creator_applications" (
	"id" uuid PRIMARY KEY,
	"applicant_user_id" uuid NOT NULL,
	"state" "ador"."creator_application_state" DEFAULT 'draft'::"ador"."creator_application_state" NOT NULL,
	"draft" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_applications_revision_positive" CHECK ("revision" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "creator_events_idempotency_unique" ON "ador"."creator_admission_events" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "creator_events_application_created_idx" ON "ador"."creator_admission_events" ("application_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_snapshots_application_sequence_unique" ON "ador"."creator_application_snapshots" ("application_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_applications_applicant_unique" ON "ador"."creator_applications" ("applicant_user_id");--> statement-breakpoint
CREATE INDEX "creator_applications_state_updated_idx" ON "ador"."creator_applications" ("state","updated_at");--> statement-breakpoint
ALTER TABLE "ador"."creator_admission_events" ADD CONSTRAINT "creator_admission_events_neS4CtPDyx1S_fkey" FOREIGN KEY ("application_id") REFERENCES "ador"."creator_applications"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."creator_admission_events" ADD CONSTRAINT "creator_admission_events_p67iLwn7UB3R_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "ador"."creator_application_snapshots"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."creator_admission_events" ADD CONSTRAINT "creator_admission_events_actor_user_id_auth_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."creator_application_snapshots" ADD CONSTRAINT "creator_application_snapshots_81VSL4Ifl3B9_fkey" FOREIGN KEY ("application_id") REFERENCES "ador"."creator_applications"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."creator_application_snapshots" ADD CONSTRAINT "creator_application_snapshots_7LdMOFcYpJxb_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."creator_applications" ADD CONSTRAINT "creator_applications_applicant_user_id_auth_users_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;