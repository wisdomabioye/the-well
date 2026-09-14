# Uploads feature

Contributes the authenticated, idempotent direct-upload-intent API operation. Registration receives
the platform provider registry explicitly, so removing its one line detaches routes and storage use.

The feature validates HTTP input through `@ador/shared/uploads`, delegates persistence and signing to
`@ador/uploads`, and imports no R2 implementation. It has no UI yet; W3-06 owns upload interaction.

Configuration uses the shared typed upload policy. Run `env:check`, `typecheck`, `test:unit`,
`test:integration`, or `test:coverage`. Platform engineering owns this feature.
