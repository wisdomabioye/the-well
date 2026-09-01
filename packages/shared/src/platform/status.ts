import { z } from "zod";

export const platformStatusInputSchema = z.object({}).strict();

export const platformStatusSchema = z
  .object({
    apiVersion: z.literal("v1"),
    registeredFeatures: z.number().int().nonnegative(),
    stage: z.literal("foundation"),
    transactionalActions: z.literal("gated"),
  })
  .strict();

export type PlatformStatusInput = z.infer<typeof platformStatusInputSchema>;
export type PlatformStatus = z.infer<typeof platformStatusSchema>;
