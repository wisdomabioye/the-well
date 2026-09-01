import { z } from "zod";

export const platformStatusInputSchema = z.object({}).strict();

export const platformStatusRoute = Object.freeze({
  method: "GET",
  operationId: "getPlatformStatus",
  path: "/api/v1/platform",
} as const);

export const platformApiInfo = Object.freeze({
  title: "The Well API",
  version: "1.0.0",
});

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
