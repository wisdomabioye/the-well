CREATE TYPE "ador"."account_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "ador"."organization_role" AS ENUM('owner', 'admin', 'editor', 'analyst');--> statement-breakpoint
CREATE TYPE "ador"."platform_role" AS ENUM('reviewer', 'staff');--> statement-breakpoint
CREATE TABLE "ador"."organization_memberships" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "ador"."organization_role" NOT NULL,
	"status" "ador"."account_status" DEFAULT 'active'::"ador"."account_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ador"."organizations" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"status" "ador"."account_status" DEFAULT 'active'::"ador"."account_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_nonempty" CHECK (length("name") > 0 and "name" = btrim("name"))
);
--> statement-breakpoint
CREATE TABLE "ador"."platform_role_assignments" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"role" "ador"."platform_role" NOT NULL,
	"status" "ador"."account_status" DEFAULT 'active'::"ador"."account_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_org_user_unique" ON "ador"."organization_memberships" ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_id_idx" ON "ador"."organization_memberships" ("user_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_org_role_status_idx" ON "ador"."organization_memberships" ("organization_id","role","status");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_role_assignments_user_role_unique" ON "ador"."platform_role_assignments" ("user_id","role");--> statement-breakpoint
CREATE INDEX "platform_role_assignments_role_status_idx" ON "ador"."platform_role_assignments" ("role","status");--> statement-breakpoint
ALTER TABLE "ador"."organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "ador"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ador"."organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ador"."platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "ador"."auth_users"("id") ON DELETE CASCADE;