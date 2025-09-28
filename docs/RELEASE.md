# Release Process

## Overview
This document outlines the simplified release process for the Toggl CLI after the Commander.js architecture migration.

## Pre-Release Checklist

1. **Quality Gates**: Ensure all CI checks pass
   ```bash
   yarn verify  # Runs lint + test + build
   ```

2. **Version Update**: Update version in `package.json`
   ```bash
   # Example: Update from 0.6.0 to 0.7.0
   vim package.json  # Edit version field
   ```

3. **Test CLI Functionality**: Basic smoke test
   ```bash
   yarn build
   ./bin/run.js --version
   ./bin/run.js --help
   ./bin/run.js ping --help
   ```

## Release Steps

### 1. Create Release Commit
```bash
git add package.json
git commit -m "chore: bump version to X.Y.Z

Brief summary of changes in this release"
```

### 2. Push and Create Release
```bash
git push origin main
gh release create vX.Y.Z --title "vX.Y.Z - Release Title" --notes "Release notes"
```

### 3. Release Notes Template
```markdown
## 🚀 Release Title

### ✨ New Features
- Feature descriptions

### 🔧 Technical Improvements
- Technical improvements

### 🛠️ Internal Changes
- Internal changes

### 🐛 Bug Fixes
- Bug fixes
```

## Performance Targets

- **Build time**: <3 seconds ✅ (currently ~1s)
- **Test time**: <5 seconds ✅ (currently <2s)
- **CLI startup**: <100ms ✅

## CI/CD Workflows

### Quality Gates (Automatic)
- **Lint**: TypeScript compilation + ESLint (when configured)
- **Test**: Unit tests + CLI smoke tests
- **Build**: Full build + binary verification
- **CI**: Comprehensive quality check with performance monitoring

### Branch Protection
All workflows must pass before merging to `main`:
- Lint workflow
- Test workflow
- Build workflow
- CI workflow

## Build Artifacts

The following artifacts are generated:
- `dist/` - Compiled JavaScript
- `bin/run.js` - CLI executable
- GitHub Actions artifacts (retention: 3-7 days)

## Scripts Reference

| Script | Purpose | Performance |
|--------|---------|-------------|
| `yarn build` | Clean + compile TypeScript | ~1s |
| `yarn test` | Run unit tests | <2s |
| `yarn verify` | Full quality check | ~5s |
| `yarn clean` | Remove build artifacts | <0.1s |
| `yarn dev` | Development mode | - |
| `yarn start` | Run built CLI | <0.1s |

## Dependencies

### Production
- `commander` - CLI framework
- `@inquirer/prompts` - Interactive prompts
- `arktype` - Runtime validation
- `axios` - HTTP client
- `dayjs` - Date handling

### Development
- `typescript` - Type checking
- `mocha` + `chai` - Testing
- `ts-node` - TypeScript execution

## Notes

- ESLint configuration is pending - currently skipped in CI
- Integration tests structure ready but not required (commands tested manually)
- No oclif dependencies remaining after architecture migration
- Uses yarn throughout (no npm commands)