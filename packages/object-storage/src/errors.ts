export type ObjectStorageErrorCode =
  "conflict" | "invalid-provider-response" | "not-found" | "provider-failure";

export class ObjectStorageError extends Error {
  readonly code: ObjectStorageErrorCode;

  constructor(
    code: ObjectStorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ObjectStorageError";
    this.code = code;
  }
}
