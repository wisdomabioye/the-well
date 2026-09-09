import { z } from "zod";

export const accountStatuses = ["active", "suspended"] as const;
export const accountStatusSchema = z.enum(accountStatuses);

export const organizationRoles = [
  "owner",
  "admin",
  "editor",
  "analyst",
] as const;
export const organizationRoleSchema = z.enum(organizationRoles);

export const platformRoles = ["reviewer", "staff"] as const;
export const platformRoleSchema = z.enum(platformRoles);
export const organizationNameSchema = z.string().trim().min(1).max(120);
export const accountReasonCodeSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/u);

export const capabilitySchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/u);

export const authorizationPolicySchema = z
  .object({
    organization: z.record(
      organizationRoleSchema,
      z.array(capabilitySchema).readonly(),
    ),
    platform: z.record(
      platformRoleSchema,
      z.array(capabilitySchema).readonly(),
    ),
    version: z.string().min(1).max(64),
  })
  .strict();

export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AuthorizationPolicy = z.infer<typeof authorizationPolicySchema>;
export type Capability = z.infer<typeof capabilitySchema>;
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;
export type PlatformRole = z.infer<typeof platformRoleSchema>;
