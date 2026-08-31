export const environmentNames = [
  "local",
  "test",
  "preview",
  "production",
] as const;

export type EnvironmentName = (typeof environmentNames)[number];

export interface EnvironmentDefinition {
  description: string;
  exposure: "public" | "server";
  key: string;
  required: boolean;
  secret: boolean;
}

export const environmentDefinitions = [
  {
    key: "APP_ENV",
    description: "Runtime environment; independent from the hosting provider.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "PUBLIC_BASE_URL",
    description: "Canonical origin used for links and redirects.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "NEXT_PUBLIC_APP_NAME",
    description: "Product name safe to expose in browser bundles.",
    exposure: "public",
    required: true,
    secret: false,
  },
] as const satisfies readonly EnvironmentDefinition[];

export const environmentKeys = environmentDefinitions.map(({ key }) => key);
