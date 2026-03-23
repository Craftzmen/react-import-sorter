# Contributing to react-import-sorter

Thanks for contributing.

## Local development

1. Install dependencies:

```bash
npm ci
```

2. Build:

```bash
npm run build
```

3. Run tests:

```bash
npm test
```

4. Run the CLI locally:

```bash
node dist/bin/cli.js path/to/file.ts
```

## Pull request checklist

1. Keep changes scoped and include tests for behavior changes.
2. Run `npm test` before opening or updating a PR.
3. Update README when adding options, API exports, or config behavior.
4. Add an entry to `CHANGELOG.md` under `Unreleased`.

## Semver policy

- Patch: bug fixes, docs-only changes, internal refactors with no public behavior change.
- Minor: new backwards-compatible CLI options, API exports, or config capabilities.
- Major: breaking API changes, changed default grouping behavior, or removed options.

## Release checklist

1. Ensure `CHANGELOG.md` has finalized notes for the release version.
2. Run release validation:

```bash
npm run release:check
```

3. Update the version:

```bash
npm version <patch|minor|major>
```

4. Push commit and tag:

```bash
git push && git push --tags
```

The GitHub Actions release workflow will automatically:
- Run `npm run release:check` to validate the build
- Publish to npm using the `NPM_TOKEN` secret
- Create a GitHub Release with changelog reference

**Note:** Ensure you have configured the `NPM_TOKEN` secret in the GitHub repository settings before publishing.
