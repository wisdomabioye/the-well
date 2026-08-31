import { z } from "zod";

import { environmentNames } from "./definitions.ts";

export const environmentSchema = z.object({
  APP_ENV: z.enum(environmentNames),
  PUBLIC_BASE_URL: z.url(),
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1),
});

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(source: NodeJS.ProcessEnv): AppEnvironment {
  return environmentSchema.parse({
    APP_ENV: source.APP_ENV,
    PUBLIC_BASE_URL: source.PUBLIC_BASE_URL,
    NEXT_PUBLIC_APP_NAME: source.NEXT_PUBLIC_APP_NAME,
  });
}
