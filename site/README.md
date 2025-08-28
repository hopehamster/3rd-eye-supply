# 3rd Eye Supply - Astro Site Source

This directory contains the source code for the 3rd Eye Supply e-commerce website built with Astro.

## 🚀 Quick Start

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

## 📁 Project Structure

```
site/
├── src/
│   ├── components/     # Reusable Astro components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Page routes
│   └── data/           # Product data (products.json)
├── public/             # Static assets
├── scripts/            # Build and utility scripts
└── astro.config.mjs    # Astro configuration
```

## 🔧 Configuration

The site is configured to deploy to GitHub Pages at `/3rd-eye-supply/`.

- **Base URL**: `https://hopehamster.github.io/3rd-eye-supply/`
- **Framework**: Astro 4.x
- **Styling**: Tailwind CSS
- **E-commerce**: Snipcart integration

## 📦 Building for Deployment

```bash
# Build the site
npm run build

# Copy built files to root for GitHub Pages
cp -r dist/* ../
cp dist/.nojekyll ../
```

## 🛍️ Product Management

Products are managed in `src/data/products.json`. Each product includes:
- Basic info (name, price, description)
- Images (WebP format, multiple sizes)
- Categories
- Dropshipping info (supplier, lead time)

## 🔄 Updating the Live Site

1. Make changes in the `site/` directory
2. Run `npm run build`
3. Copy built files to root
4. Commit and push to GitHub
5. GitHub Pages will automatically deploy

## 🎨 Customization

- **Colors/Theme**: Edit Tailwind config and component styles
- **Products**: Update `src/data/products.json`
- **Pages**: Add/edit files in `src/pages/`
- **Components**: Create reusable components in `src/components/`
