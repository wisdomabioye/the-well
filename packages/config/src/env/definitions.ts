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
  {
    key: "DATABASE_URL",
    description: "Standard PostgreSQL runtime connection URL.",
    exposure: "server",
    required: true,
    secret: true,
  },
  {
    key: "DATABASE_MIGRATION_URL",
    description: "Optional privileged migration URL; blank uses DATABASE_URL.",
    exposure: "server",
    required: false,
    secret: true,
  },
  {
    key: "DATABASE_SSL_MODE",
    description: "PostgreSQL TLS policy: disable, require, or verify-full.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "DATABASE_POOL_MAX",
    description: "Maximum runtime PostgreSQL pool connections per process.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "DATABASE_ACQUIRE_TIMEOUT_MS",
    description: "Maximum milliseconds to acquire a PostgreSQL connection.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "DATABASE_IDLE_TIMEOUT_MS",
    description: "Milliseconds before an idle pooled connection is closed.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "DATABASE_STATEMENT_TIMEOUT_MS",
    description: "Maximum PostgreSQL statement execution time in milliseconds.",
    exposure: "server",
    required: true,
    secret: false,
  },
  {
    key: "AUTH_SESSION_IDLE_TIMEOUT_MS",
    description:
      "Sliding idle lifetime for authenticated platform sessions in milliseconds.",
    exposure: "server",
    required: true,
    secret: false,
  },
] as const satisfies readonly EnvironmentDefinition[];

export const environmentKeys = environmentDefinitions.map(({ key }) => key);
