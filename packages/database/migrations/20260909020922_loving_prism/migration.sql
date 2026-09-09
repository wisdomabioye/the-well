CREATE TYPE "ador"."account_audit_action" AS ENUM('organization-created', 'membership-created', 'membership-updated');--> statement-breakpoint
CREATE TABLE "ador"."account_audit_events" (
	"id" uuid PRIMARY KEY,
	"action" "ador"."account_audit_action" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"previous_role" "ador"."organization_role",
	"previous_status" "ador"."account_status",
	"next_role" "ador"."organization_role" NOT NULL,
	"next_status" "ador"."account_status" NOT NULL,
	"policy_version" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_audit_events_policy_version_nonempty" CHECK (length("policy_version") > 0 and "policy_version" = btrim("policy_version"))
);
--> statement-breakpoint
CREATE INDEX "account_audit_events_org_created_idx" ON "ador"."account_audit_events" ("organization_id","created_at");--> statement-breakpoint
ALTER TABLE "ador"."account_audit_events" ADD CONSTRAINT "account_audit_events_actor_user_id_auth_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."account_audit_events" ADD CONSTRAINT "account_audit_events_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "ador"."organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ador"."account_audit_events" ADD CONSTRAINT "account_audit_events_target_user_id_auth_users_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "ador"."auth_users"("id") ON DELETE RESTRICT;