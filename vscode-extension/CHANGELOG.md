# Changelog

All notable changes to the React Import Sorter VS Code Extension will be documented in this file.

## [0.1.0] - 2026-03-23

### Added
- Initial release of React Import Sorter VS Code Extension
- Smart import sorting for JavaScript and TypeScript files
- Multi-language support for Vue, Svelte, and Angular
- Code Actions integration (light bulb quick fixes)
- Auto-sort on file save capability
- Performance optimization with caching system
- Framework priority configuration
- Parse error handling with customizable behavior
- Comprehensive test coverage (92+ tests)

### Features
- Command: "React Import Sorter: Sort Imports"
- Settings:
  - `reactImportSorter.frameworkPriority` - Customize framework import order
  - `reactImportSorter.throwOnParseError` - Control error reporting
  - `reactImportSorter.enableFormatOnSave` - Enable auto-sorting on save

### Supported Languages
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Vue (.vue)
- Svelte (.svelte)
- Angular (.component.ts)

## Future Roadmap

### v0.2.0 (Planned)
- Performance improvements for very large files
- Custom import grouping rules
- Per-file configuration support
- Integration with other formatters

### v0.3.0 (Planned)
- Additional language support
- Theme-aware icons
- Keyboard shortcut customization
- Online documentation

### v1.0.0 (Planned)
- API stability
- Full test coverage
- Complete documentation
- Community-driven features
