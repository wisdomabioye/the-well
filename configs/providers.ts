import { laserEyesProvider } from "@ador/wallet/registration";
import { createProviderRegistry } from "@ador/plugin-kit/providers";
import { r2ObjectStorageProvider } from "@ador/provider-object-storage-r2/registration";

export const providerRegistry = createProviderRegistry([
  laserEyesProvider,
  r2ObjectStorageProvider,
]);
