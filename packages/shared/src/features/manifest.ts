import { z } from "zod";

import { httpMethodSchema } from "@ador/shared/http";

const featureIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const semanticVersionPattern = /^\d+\.\d+\.\d+$/;
const decisionGateIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const featureCapabilitySchema = z.enum([
  "api-routes",
  "navigation",
  "public-page",
  "scheduled-workflows",
  "studio-page",
]);

export const providerCapabilitySchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+$/);

export const decisionGateIdSchema = z.string().regex(decisionGateIdPattern);

export const routeContributionSchema = z
  .object({
    method: httpMethodSchema,
    operationId: z.string().regex(/^[a-z][A-Za-z0-9]*$/),
    path: z
      .string()
      .regex(
        /^\/api\/v1\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
      ),
  })
  .strict()
  .readonly();

export const pageContributionSchema = z
  .object({
    path: z
      .string()
      .regex(
        /^\/$|^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
      ),
  })
  .strict()
  .readonly();

export const featureIdSchema = z.string().regex(featureIdPattern);
export const providerIdSchema = z.string().regex(featureIdPattern);

export const featureManifestSchema = z
  .object({
    id: featureIdSchema,
    version: z.string().regex(semanticVersionPattern),
    capabilities: z
      .array(featureCapabilitySchema)
      .min(1)
      .refine((items) => new Set(items).size === items.length)
      .readonly(),
    dependencies: z.array(featureIdSchema).readonly(),
    requiredProviderCapabilities: z
      .array(providerCapabilitySchema)
      .refine((items) => new Set(items).size === items.length)
      .readonly(),
    requiredDecisionGates: z
      .array(decisionGateIdSchema)
      .refine((items) => new Set(items).size === items.length)
      .readonly(),
    pages: z.array(pageContributionSchema).readonly(),
    routes: z.array(routeContributionSchema).readonly(),
  })
  .strict()
  .readonly();

export const providerManifestSchema = z
  .object({
    capabilities: z
      .array(providerCapabilitySchema)
      .min(1)
      .refine((items) => new Set(items).size === items.length)
      .readonly(),
    requiredDecisionGates: z
      .array(decisionGateIdSchema)
      .refine((items) => new Set(items).size === items.length)
      .readonly(),
    id: providerIdSchema,
    version: z.string().regex(semanticVersionPattern),
  })
  .strict()
  .readonly();

export type FeatureCapability = z.infer<typeof featureCapabilitySchema>;
export type DecisionGateId = z.infer<typeof decisionGateIdSchema>;
export type FeatureId = z.infer<typeof featureIdSchema>;
export type FeatureManifest = z.infer<typeof featureManifestSchema>;
export type ProviderCapability = z.infer<typeof providerCapabilitySchema>;
export type ProviderId = z.infer<typeof providerIdSchema>;
export type ProviderManifest = z.infer<typeof providerManifestSchema>;
export type PageContribution = z.infer<typeof pageContributionSchema>;
export type RouteContribution = z.infer<typeof routeContributionSchema>;
