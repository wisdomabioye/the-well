import type { ProviderServices } from "@ador/plugin-kit/providers";

import type { ObjectStoragePort } from "./contracts.ts";

declare module "@ador/plugin-kit/providers" {
  interface ProviderServices {
    readonly "object-storage:s3-compatible": ObjectStoragePort;
  }
}

export type ObjectStorageProviderServices = Pick<
  ProviderServices,
  "object-storage:s3-compatible"
>;
