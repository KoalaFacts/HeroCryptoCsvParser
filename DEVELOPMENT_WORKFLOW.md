# Development Workflow

## Recommended Approach: Use Local Version for Demo

**For the demo site deployed to Vercel**, always use the local version via `file:` dependency.

### Why?

- ✅ Demo always showcases latest features (even unpublished)
- ✅ No version mismatch between code and demo
- ✅ No need to publish to npm before testing Vercel preview
- ✅ One source of truth: the code in the repo
- ✅ Build time impact is minimal (~10s extra)

### Setup

Update demo to use local build:

```bash
cd demo
npm install --save file:../
git add package.json package-lock.json
git commit -m "chore: use local build for demo"
git push
```

### Development Workflow

#### Option 1: Using npm link (Hot Reload)

Best for active development with hot module reload:

```bash
# Terminal 1: Build library and watch for changes
npm run dev

# Terminal 2: Link to local build
npm link
cd demo
npm link @koalafacts/hero-crypto-csv-parser
npm run dev
```

#### Option 2: Using file: dependency

Best for testing exact build that Vercel will use:

```bash
# Rebuild library
npm run build

# Demo automatically uses local build
cd demo
npm run dev
```

## Publishing to NPM

When you want to publish a new version for users:

```bash
# 1. Update version in package.json
# Already at 0.2.0

# 2. Run full test suite
npm test
npm run test:coverage

# 3. Build library
npm run build

# 4. Publish to npm
npm publish

# 5. Create git tag
git tag v0.2.0
git push --tags
```

## Cleanup npm link

If you used `npm link` and want to go back to `file:` dependency:

```bash
cd demo
npm unlink @koalafacts/hero-crypto-csv-parser
npm install  # Re-installs from package.json (file:../)

# Optional: Remove global link
npm unlink -g @koalafacts/hero-crypto-csv-parser
```

## Current Status

Your PR currently uses:
- Demo dependency: `^0.2.0` (expects npm registry) ❌

Should be:
- Demo dependency: `file:../` (uses local build) ✅

This will make Vercel previews work immediately!
