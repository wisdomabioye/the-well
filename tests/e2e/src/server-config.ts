export interface E2EServerConfig {
  readonly baseURL: string;
  readonly port: string;
}

const defaultBaseURL = "http://127.0.0.1:4173";

export function resolveE2EServerConfig(
  configuredBaseURL?: string,
): E2EServerConfig {
  const baseURL = configuredBaseURL ?? defaultBaseURL;
  const url = new URL(baseURL);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("E2E_BASE_URL must use HTTP or HTTPS.");
  }
  if (!url.port) {
    throw new Error("E2E_BASE_URL must include an explicit port.");
  }
  return { baseURL: url.href.replace(/\/$/, ""), port: url.port };
}
