# Changelog

All notable changes to this project will be documented in this file.

This project follows Semantic Versioning.

## Unreleased

## 1.2.0

### Added

- Multi-language import sorting support for Vue, Svelte, and Angular files.
- Performance utilities including sort-result caching, incremental sorting checks, and telemetry metrics.
- Formatter plugin registry with Prettier, Biome, and Deno formatter plugin integrations.
- VS Code extension publishing workflow, release docs, and enhancement summary documentation.

### Changed

- Public API exports expanded with language-aware sorting, performance helpers, and formatter plugins.
- VS Code extension metadata and documentation updated for marketplace readiness.

### Testing

- Expanded test coverage to 115 passing tests across core, extension, performance, and formatter suites.

## 1.1.0

### Added

- Release process documentation and release-check scripts.

- `sortImportsResult` with diagnostics, metadata, and parse error handling.
- Config discovery via `.react-import-sorter.json`, `react-import-sorter.config.json`, and `package.json` keys.
- CLI modes: `--check`, `--dry-run`, `--quiet`, and `--config`.
- Prettier plugin bridge at `react-import-sorter/prettier-plugin`.
- Unit and integration tests plus CI workflow.

### Changed

- Package exports aligned with built `dist` artifacts.
- README expanded with API/config/plugin documentation.
