# `@ador/provider-object-storage-r2`

Cloudflare R2 adapter for the platform-owned `ObjectStoragePort`.

## Public API and registration

`createR2ObjectStorage` accepts validated configuration and returns only the provider-neutral port.
`r2ObjectStorageProvider` is the explicit one-line registration used by the platform provider list.
Removing that registration detaches the provider without changing features or domain packages.
The registry resolves the same process-local `ObjectStoragePort` through the typed
`object-storage:s3-compatible` capability and validates configuration only when that service is used.

## Configuration

The adapter exclusively owns `R2_ENDPOINT`, `R2_REGION`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`, and `R2_PUBLIC_BUCKET`. The two bucket names must differ.
Credentials and bucket names never enter browser bundles or platform records.

## Invariants and operations

Presigned uploads target only the private bucket and bind the exact key, content type, and byte
length. Reads and writes remain streamed. Public writes and private-to-public copies use atomic
destination preconditions. Only the R2 S3-compatible operations qualified here are supported;
multipart upload, lifecycle cleanup, public URL construction, and media policy belong elsewhere.

Cloudflare's destination-conditional `CopyObject` header is an R2 extension currently documented as
beta, so deployment qualification against R2 remains a release requirement. Platform engineering
owns this provider. Integration and coverage scripts start an exact-image-pinned disposable MinIO
service for standard S3 protocol conformance; the R2-only copy extension uses a wire-level harness.
Run `env:check`, `typecheck`, `test:unit`, `test:integration`, or `test:coverage`.
