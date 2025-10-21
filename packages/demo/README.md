# Hero Crypto CSV Parser - Demo

Interactive web demo for the Hero Crypto CSV Parser library. Transform cryptocurrency transaction exports into standardized, tax-ready formats directly in your browser.

## 🚀 Live Demo

**[Try it live →](https://hero-crypto-parser.vercel.app)**

## ✨ Features

- **🔄 Universal Exchange Support** - Process Binance transaction exports
- **🎯 Smart Categorization** - Automatic transaction type detection
- **📊 CSV Export** - Download processed transactions
- **🔒 Privacy First** - All processing happens in your browser
- **⚡ Lightning Fast** - Instant transaction processing
- **🏷️ Tax Ready** - Standardized format for accounting software

## 🛠️ Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run code linting
- `npm run format` - Format code with Biome

## 📦 Deployment

### Vercel (Recommended)

This demo is configured for zero-config deployment on Vercel:

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel

   # Deploy from demo directory
   cd demo
   vercel
   ```

2. **Automatic Deployment**
   - Push to GitHub repository
   - Vercel automatically detects and deploys changes
   - Live URL: `https://your-project.vercel.app`

3. **Custom Domain**
   - Add custom domain in Vercel dashboard
   - Automatic HTTPS and CDN included

### Alternative Hosting

**Netlify:**
```bash
# Build and deploy
npm run build
# Drag and drop `dist` folder to Netlify
```

**GitHub Pages:**
```bash
# Build static files
npm run build
# Deploy `dist` folder to gh-pages branch
```

## 🏗️ Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling framework
- **DaisyUI v5** - Component library
- **@beingciteable/hero-csv-crypto-parser** - Core parsing library

## 📄 License

MIT License - see the [main project](../README.md) for details.
