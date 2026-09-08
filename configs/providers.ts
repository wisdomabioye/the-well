import { laserEyesProvider } from "@ador/wallet/registration";
import { createProviderRegistry } from "@ador/plugin-kit/providers";

export const providerRegistry = createProviderRegistry([laserEyesProvider]);
