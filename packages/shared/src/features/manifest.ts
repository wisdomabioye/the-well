import { z } from "zod";

const featureIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const semanticVersionPattern = /^\d+\.\d+\.\d+$/;

export const featureCapabilitySchema = z.enum([
  "api-routes",
  "navigation",
  "public-page",
  "scheduled-workflows",
  "studio-page",
]);

export const featureIdSchema = z.string().regex(featureIdPattern);

export const featureManifestSchema = z
  .object({
    id: featureIdSchema,
    version: z.string().regex(semanticVersionPattern),
    capabilities: z.array(featureCapabilitySchema).min(1).readonly(),
    dependencies: z.array(featureIdSchema).readonly(),
  })
  .strict();

export type FeatureCapability = z.infer<typeof featureCapabilitySchema>;
export type FeatureId = z.infer<typeof featureIdSchema>;
export type FeatureManifest = z.infer<typeof featureManifestSchema>;
