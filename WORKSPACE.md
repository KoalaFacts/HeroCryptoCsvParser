# Workspace Structure

This project uses npm workspaces to organize the monorepo.

## Structure

```
HeroCryptoCsvParser/
├── packages/
│   ├── core/                    # @beingciteable/hero-csv-crypto-parser
│   │   ├── src/                 # Core library source code
│   │   ├── tests/               # Core library tests
│   │   ├── package.json         # Core package config
│   │   └── tsconfig.json        # TypeScript config
│   └── demo/                    # @beingciteable/hero-csv-crypto-parser-demo
│       ├── src/                 # Demo application source
│       ├── public/              # Static assets
│       ├── package.json         # Demo package config
│       └── vite.config.ts       # Vite config
├── package.json                 # Root workspace config
├── biome.json                   # Shared linter/formatter config
└── README.md                    # Project documentation
```

## Packages

### `packages/core`
The main library package `@beingciteable/hero-csv-crypto-parser`. Contains:
- CSV parsing framework
- Cryptocurrency transaction models
- Tax reporting engine
- Exchange adapters (Binance, etc.)

### `packages/demo`
Demo application `@beingciteable/hero-csv-crypto-parser-demo`. Contains:
- React/Vite demo application
- Example usage of the core library
- Interactive showcase

## Development Commands

### Root Level Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run linting on all packages
npm run lint

# Format all code
npm run format

# Type check all packages
npm run typecheck

# Run tests (core package)
npm test

# Start demo dev server
npm run demo

# Build demo for production
npm run demo:build
```

### Working with Specific Packages

```bash
# Build only core package
npm run build --workspace=packages/core

# Test only core package
npm run test --workspace=packages/core

# Run demo dev server
npm run dev --workspace=packages/demo
```

### Package-Specific Commands

```bash
# Work in core package
cd packages/core
npm run build
npm test
npm run typecheck

# Work in demo package
cd packages/demo
npm run dev
npm run build
```

## Package Linking

The demo package uses a local file reference to the core package:

```json
{
  "dependencies": {
    "@beingciteable/hero-csv-crypto-parser": "file:../core"
  }
}
```

This means:
- Changes in `packages/core` are immediately available to `packages/demo` after rebuild
- No need to publish to npm during development
- Full TypeScript support and intellisense

## CI/CD

The CI pipeline has been updated to work with workspaces:
- Builds and tests all packages
- Only publishes the core package to npm
- Deploys demo to Vercel

## Migration Notes

The project was restructured from a flat structure to npm workspaces:
- `/src` → `/packages/core/src`
- `/tests` → `/packages/core/tests`
- `/demo` → `/packages/demo`

Old directories in the root are ignored by git and can be manually removed.

## Benefits

✅ Better code organization
✅ Clearer separation of concerns
✅ Shared tooling configuration (biome, TypeScript)
✅ Easier dependency management
✅ Scalable for future packages
