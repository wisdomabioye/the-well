import { describe, expect, it } from "vitest";

import { parseR2Environment, r2ConfigSchema } from "../src/config.ts";
import { createR2Client } from "../src/r2-client.ts";

const valid = {
  accessKeyId: "access",
  endpoint: "https://account.r2.cloudflarestorage.com",
  privateBucket: "private-assets",
  publicBucket: "public-assets",
  region: "auto",
  secretAccessKey: "secret",
};

describe("R2 configuration", () => {
  it("parses the server environment into owned configuration", () => {
    expect(
      parseR2Environment({
        R2_ACCESS_KEY_ID: valid.accessKeyId,
        R2_ENDPOINT: valid.endpoint,
        R2_PRIVATE_BUCKET: valid.privateBucket,
        R2_PUBLIC_BUCKET: valid.publicBucket,
        R2_REGION: valid.region,
        R2_SECRET_ACCESS_KEY: valid.secretAccessKey,
      }),
    ).toEqual(valid);
  });

  it.each([
    { ...valid, endpoint: "http://insecure.example.invalid" },
    { ...valid, publicBucket: valid.privateBucket },
    { ...valid, privateBucket: "Bad_Name" },
    { ...valid, privateBucket: "Bad-name" },
    { ...valid, privateBucket: "bad.name" },
    { ...valid, privateBucket: "-bad-name" },
  ])("rejects insecure or contradictory configuration", (input) => {
    expect(() => r2ConfigSchema.parse(input)).toThrow();
  });

  it("constructs the production SDK client without making a provider request", () => {
    expect(createR2Client(valid)).toMatchObject({
      copyIfAbsent: expect.any(Function),
      presignPut: expect.any(Function),
      put: expect.any(Function),
    });
  });
});
