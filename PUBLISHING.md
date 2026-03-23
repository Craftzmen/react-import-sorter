# Publishing the VS Code Extension

This guide explains how to publish the React Import Sorter VS Code Extension to the VS Code Marketplace.

## Prerequisites

1. **VS Code Marketplace Account**
   - Create a [Microsoft Account](https://account.microsoft.com/)
   - Join the [VS Code Marketplace](https://marketplace.visualstudio.com/)
   - Create a [Publisher profile](https://marketplace.visualstudio.com/manage)

2. **Personal Access Token (PAT)**
   - Go to https://dev.azure.com/
   - Create a Personal Access Token with "Marketplace" scope
   - Keep this token secure

3. **Required Tools**
   ```bash
   npm install -g vsce
   ```

## Manual Publishing

### 1. Prepare the Release

```bash
# Update version in vscode-extension/package.json
# Update CHANGELOG.md with release notes
# Commit changes
git add .
git commit -m "chore: prepare v0.1.0 release"
```

### 2. Build the Extension

```bash
# Build core package
npm run build

# Navigate to extension directory
cd vscode-extension

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### 3. Package the Extension

```bash
cd vscode-extension
vsce package
```

This creates a `.vsix` file that contains the packaged extension.

### 4. Publish to Marketplace

```bash
cd vscode-extension
vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN
```

Or publish pre-packaged `.vsix`:

```bash
vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN --packagePath react-import-sorter-vscode-0.1.0.vsix
```

## Automated Publishing with GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/publish-vscode-extension.yml`) that automatically publishes when you push a tag matching `vscode-v*`.

### To Publish Automatically:

1. **Set up the Personal Access Token**
   ```
   Settings → Secrets and variables → Actions → New repository secret
   Name: VSCODE_MARKETPLACE_TOKEN
   Value: <your-pat>
   ```

2. **Create a release tag**
   ```bash
   # Tag format: vscode-vX.Y.Z
   git tag vscode-v0.1.0
   git push origin vscode-v0.1.0
   ```

3. **GitHub Actions will automatically**
   - Build the extension
   - Publish to VS Code Marketplace
   - Create a GitHub Release
   - Attach the `.vsix` file

## Versioning

The VS Code Extension uses semantic versioning:
- **MAJOR.MINOR.PATCH** (e.g., 0.1.0)
- Increment MAJOR for breaking changes
- Increment MINOR for new features
- Increment PATCH for bug fixes

## Pre-Release Publishing

For beta/pre-release versions:

```bash
vsce publish --pre-release -p YOUR_TOKEN
```

## Troubleshooting

### "Authentication failed"
- Verify your Personal Access Token is valid
- Ensure the token has "Marketplace" scope
- Check token hasn't expired

### "Invalid publisher"
- Verify publisher name in `package.json` matches your Marketplace publisher

### Extension won't load
- Run `npm run build` to ensure TypeScript is compiled
- Check `.vscodeignore` is excluding source files

### Icon not displaying
- Ensure `icon.png` exists and is 128x128px
- Verify path in `package.json`

## Marketing Tips

1. **README.md**
   - Include screenshots/GIFs
   - Provide clear usage examples
   - List all features

2. **Marketplace Description**
   - Write 1-2 sentences
   - Include main keywords
   - Link to GitHub repository

3. **Keywords**
   - Add relevant keywords in `package.json`
   - Consider user search patterns

## Links

- [VSCE Documentation](https://github.com/microsoft/vscode-vsce)
- [VS Code Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Marketplace Policies](https://marketplace.visualstudio.com/manage/publishers)
- [Personal Access Token Creation](https://dev.azure.com/)
