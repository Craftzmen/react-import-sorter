# Changelog

All notable changes to this project will be documented in this file.

This project follows Semantic Versioning.

## Unreleased

### Added

- Release process documentation and release-check scripts.

## 1.1.0

### Added

- `sortImportsResult` with diagnostics, metadata, and parse error handling.
- Config discovery via `.react-import-sorter.json`, `react-import-sorter.config.json`, and `package.json` keys.
- CLI modes: `--check`, `--dry-run`, `--quiet`, and `--config`.
- Prettier plugin bridge at `react-import-sorter/prettier-plugin`.
- Unit and integration tests plus CI workflow.

### Changed

- Package exports aligned with built `dist` artifacts.
- README expanded with API/config/plugin documentation.
