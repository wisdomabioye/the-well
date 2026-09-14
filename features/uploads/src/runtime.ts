import { randomBytes } from "node:crypto";

import {
  createDatabaseClient,
  createDatabasePool,
  parseDatabaseEnvironment,
} from "@ador/database/connection";
import type { ObjectStorageProviderServices } from "@ador/object-storage";
import type { ProviderRegistry } from "@ador/plugin-kit/providers";
import { createUuidV7 } from "@ador/shared/identifiers";
import {
  createDrizzleUploadIntentRepository,
  createUploadIntentService,
} from "@ador/uploads";

export function createUploadServiceResolver(providers: ProviderRegistry) {
  type StorageService =
    ObjectStorageProviderServices["object-storage:s3-compatible"];
  let service:
    Promise<ReturnType<typeof createUploadIntentService>> | undefined;
  return () => {
    service ??= providers
      .resolve("object-storage:s3-compatible")
      .then((storage: StorageService) => {
        const database = createDatabaseClient(
          createDatabasePool(parseDatabaseEnvironment(process.env)),
        );
        return createUploadIntentService({
          clock: () => new Date(),
          createDraftKey: () => randomBytes(32).toString("hex"),
          createId: createUuidV7,
          repository: createDrizzleUploadIntentRepository(database),
          storage,
        });
      });
    return service;
  };
}
