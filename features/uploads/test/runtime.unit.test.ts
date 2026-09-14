import type { DatabaseClient } from "@ador/database/connection";
import type { ObjectStoragePort } from "@ador/object-storage/contracts";
import {
  createProviderRegistry,
  defineProvider,
} from "@ador/plugin-kit/providers";
import type {
  ReserveUploadIntentResult,
  UploadIntentRepository,
  createUploadIntentService as CreateUploadIntentService,
} from "@ador/uploads";
import { providerIdSchema } from "@ador/shared/providers";
import { describe, expect, it, vi } from "vitest";

type ServiceDependencies = Parameters<typeof CreateUploadIntentService>[0];

const mockedRepository: UploadIntentRepository = {
  complete: vi.fn(),
  findForCompletion: vi.fn(),
  markSigningFailed: vi.fn(async () => undefined),
  reserve: vi.fn(async (): Promise<ReserveUploadIntentResult> => ({
    kind: "conflict",
  })),
};

const runtimeMocks = vi.hoisted(() => ({
  createRepository: vi.fn(
    (database: DatabaseClient): UploadIntentRepository => {
      void database;
      return mockedRepository;
    },
  ),
  createService: vi.fn((dependencies: ServiceDependencies) => {
    dependencies.clock();
    dependencies.createDraftKey();
    dependencies.createId();
    return { complete: vi.fn(), create: vi.fn() };
  }),
}));

vi.mock("@ador/uploads", () => ({
  createDrizzleUploadIntentRepository: runtimeMocks.createRepository,
  createUploadIntentService: runtimeMocks.createService,
}));

import { createUploadServiceResolver } from "../src/runtime.ts";

const unusedStorage: ObjectStoragePort = {
  copyPrivateToPublicIfAbsent: vi.fn(async () => {
    throw new Error("unused");
  }),
  delete: vi.fn(async () => undefined),
  head: vi.fn(async () => null),
  presignPrivateUpload: vi.fn(async () => {
    throw new Error("unused");
  }),
  providerId: providerIdSchema.parse("test-object-storage"),
  read: vi.fn(async () => {
    throw new Error("unused");
  }),
  write: vi.fn(async () => {
    throw new Error("unused");
  }),
};

function providers() {
  return createProviderRegistry([
    defineProvider({
      load: async () => ({
        capabilities: ["object-storage:s3-compatible"],
        createServices: () => ({
          "object-storage:s3-compatible": unusedStorage,
        }),
        id: "test-object-storage",
        version: "1.0.0",
      }),
      manifest: {
        capabilities: ["object-storage:s3-compatible"],
        id: "test-object-storage",
        requiredDecisionGates: [],
        version: "1.0.0",
      },
    }),
  ]);
}

describe("upload runtime", () => {
  it("constructs and caches one provider-neutral service", async () => {
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_SSL_MODE = "disable";
    process.env.DATABASE_POOL_MAX = "2";
    process.env.DATABASE_ACQUIRE_TIMEOUT_MS = "1000";
    process.env.DATABASE_IDLE_TIMEOUT_MS = "1000";
    process.env.DATABASE_STATEMENT_TIMEOUT_MS = "1000";
    const resolve = createUploadServiceResolver(providers());
    const first = resolve();
    expect(resolve()).toBe(first);
    await expect(first).resolves.toBeDefined();
    expect(runtimeMocks.createRepository).toHaveBeenCalledOnce();
    expect(runtimeMocks.createService).toHaveBeenCalledWith(
      expect.objectContaining({ storage: unusedStorage }),
    );
  });
});
