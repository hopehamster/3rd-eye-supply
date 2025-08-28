#!/usr/bin/env node

/**
 * CJ Product Importer
 * Searches CJ catalog for profitable products under $15 and adds them to catalog
 */

const fs = require('fs');
const path = require('path');

// Mock CJ API response for development (replace with actual API calls)
const mockCJProducts = [
  {
    productId: "CJ001",
    productName: "Crystal Healing Set - Amethyst & Rose Quartz",
    productPrice: 12.99,
    productDescription: "Beautiful set of healing crystals including amethyst and rose quartz",
    category: "Crystals",
    inventory: 150,
    images: ["https://example.com/crystal-set.jpg"],
    weight: "0.5"
  },
  {
    productId: "CJ002",
    productName: "Essential Oil Diffuser - 100ml",
    productPrice: 8.99,
    productDescription: "Ultrasonic aromatherapy diffuser with 7 LED light colors",
    category: "Aromatherapy",
    inventory: 200,
    images: ["https://example.com/diffuser.jpg"],
    weight: "0.3"
  },
  {
    productId: "CJ003",
    productName: "Yoga Mat - Non-Slip, 6mm Thick",
    productPrice: 14.99,
    productDescription: "Premium non-slip yoga mat perfect for meditation and yoga practice",
    category: "Yoga",
    inventory: 100,
    images: ["https://example.com/yoga-mat.jpg"],
    weight: "1.5"
  },
  {
    productId: "CJ004",
    productName: "Incense Cones - Sandalwood, Pack of 20",
    productPrice: 6.99,
    productDescription: "Traditional sandalwood incense cones for meditation and relaxation",
    category: "Incense",
    inventory: 300,
    images: ["https://example.com/incense-cones.jpg"],
    weight: "0.2"
  },
  {
    productId: "CJ005",
    productName: "Tarot Card Deck - Rider Waite",
    productPrice: 11.99,
    productDescription: "Classic Rider-Waite tarot deck with guidebook",
    category: "Divination",
    inventory: 75,
    images: ["https://example.com/tarot-deck.jpg"],
    weight: "0.4"
  }
];

class CJProductImporter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.maxPrice = 15.00; // Only products under $15
    this.minProfitMargin = 0.30; // Minimum 30% profit margin
    this.shippingCategories = ['Crystals', 'Aromatherapy', 'Yoga', 'Incense', 'Divination', 'Spiritual'];
  }

  /**
   * Main import function
   */
  async importProducts() {
    console.log('🔍 Searching CJ catalog for products under $15...');

    // In production, this would make actual API calls to CJ
    // For now, we'll use mock data
    const cjProducts = await this.searchCJProducts();

    console.log(`📦 Found ${cjProducts.length} potential products from CJ`);

    // Filter and process products
    const filteredProducts = this.filterProducts(cjProducts);
    console.log(`🎯 After filtering: ${filteredProducts.length} products meet criteria`);

    // Load existing products
    const existingProducts = this.loadExistingProducts();
    console.log(`📋 Existing catalog has ${existingProducts.length} products`);

    // Add new products
    const newProducts = this.addNewProducts(filteredProducts, existingProducts);

    if (newProducts.length > 0) {
      console.log(`✅ Successfully added ${newProducts.length} new products to catalog`);
      this.saveProducts([...existingProducts, ...newProducts]);
    } else {
      console.log('ℹ️ No new products to add');
    }

    return newProducts;
  }

  /**
   * Search CJ products (mock implementation)
   */
  async searchCJProducts() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter products under $15
    return mockCJProducts.filter(product => product.productPrice < this.maxPrice);
  }

  /**
   * Filter products based on criteria
   */
  filterProducts(products) {
    return products.filter(product => {
      // Price check
      if (product.productPrice >= this.maxPrice) return false;

      // Category check
      if (!this.shippingCategories.some(cat =>
        product.category.toLowerCase().includes(cat.toLowerCase())
      )) return false;

      // Inventory check (must have some stock)
      if (product.inventory < 10) return false;

      // Profit margin calculation (assuming we sell at 2.5x supplier price)
      const sellingPrice = product.productPrice * 2.5;
      const profitMargin = (sellingPrice - product.productPrice) / sellingPrice;

      return profitMargin >= this.minProfitMargin;
    });
  }

  /**
   * Load existing products from JSON file
   */
  loadExistingProducts() {
    try {
      const productsPath = path.join(__dirname, 'site', 'src', 'data', 'products.json');
      const productsData = fs.readFileSync(productsPath, 'utf8');
      return JSON.parse(productsData);
    } catch (error) {
      console.warn('Could not load existing products, starting fresh:', error.message);
      return [];
    }
  }

  /**
   * Add new products to catalog
   */
  addNewProducts(cjProducts, existingProducts) {
    const existingIds = new Set(existingProducts.map(p => p.id));
    const newProducts = [];

    for (const cjProduct of cjProducts) {
      const productId = `cj-${cjProduct.productId}`;

      // Skip if already exists
      if (existingIds.has(productId)) {
        console.log(`⏭️ Skipping ${cjProduct.productName} (already exists)`);
        continue;
      }

      // Calculate selling price with profit margin
      const supplierPrice = cjProduct.productPrice;
      const sellingPrice = Math.ceil(supplierPrice * 2.5); // 2.5x markup
      const profitMargin = ((sellingPrice - supplierPrice) / sellingPrice * 100).toFixed(1);

      // Create new product
      const newProduct = {
        id: productId,
        slug: this.createSlug(cjProduct.productName),
        name: cjProduct.productName,
        price: sellingPrice,
        description: this.enhanceDescription(cjProduct.productDescription),
        tagline: this.createTagline(cjProduct.productName, cjProduct.category),
        category: this.mapCategory(cjProduct.category),
        images: cjProduct.images || [],
        stock: cjProduct.inventory,
        supplier: 'CJ',
        supplierSku: cjProduct.productId,
        supplierPrice: supplierPrice,
        leadTimeDays: 7, // Standard CJ shipping time
        inventory: cjProduct.inventory,
        availability: cjProduct.inventory > 50 ? 'in-stock' : 'low-stock',
        lastInventorySync: new Date().toISOString(),
        snipcart: {
          id: productId,
          price: sellingPrice,
          name: cjProduct.productName,
          description: cjProduct.productDescription
        }
      };

      newProducts.push(newProduct);
      console.log(`➕ Adding: ${cjProduct.productName} ($${sellingPrice}, ${profitMargin}% margin)`);
    }

    return newProducts;
  }

  /**
   * Create SEO-friendly slug
   */
  createSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  /**
   * Enhance product description with spiritual/supply context
   */
  enhanceDescription(description) {
    const enhancements = [
      "Perfect for your spiritual journey and personal growth.",
      "High-quality item sourced from trusted suppliers.",
      "Ideal for meditation, healing, and wellness practices.",
      "Enhance your sacred space with this beautiful addition."
    ];

    return description + " " + enhancements[Math.floor(Math.random() * enhancements.length)];
  }

  /**
   * Create compelling tagline
   */
  createTagline(name, category) {
    const taglines = {
      'Crystals': ['Elevate Your Energy', 'Crystal Healing Power', 'Spiritual Awakening'],
      'Aromatherapy': ['Scent Your Soul', 'Aromatic Bliss', 'Essential Harmony'],
      'Yoga': ['Find Your Center', 'Mindful Movement', 'Zen Practice'],
      'Incense': ['Sacred Smoke', 'Spiritual Aroma', 'Meditation Companion'],
      'Divination': ['Unlock Mysteries', 'Spiritual Guidance', 'Inner Wisdom']
    };

    const categoryTaglines = taglines[category] || ['Spiritual Essence', 'Sacred Tools', 'Wellness Journey'];
    return categoryTaglines[Math.floor(Math.random() * categoryTaglines.length)];
  }

  /**
   * Map CJ categories to our store categories
   */
  mapCategory(cjCategory) {
    const categoryMap = {
      'Crystals': 'crystals',
      'Aromatherapy': 'aromatherapy',
      'Yoga': 'yoga-accessories',
      'Incense': 'incense',
      'Divination': 'tarot-divination',
      'Spiritual': 'spiritual-tools'
    };

    return categoryMap[cjCategory] || 'spiritual-tools';
  }

  /**
   * Save products to JSON file
   */
  saveProducts(products) {
    const productsPath = path.join(__dirname, 'site', 'src', 'data', 'products.json');

    try {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`💾 Saved ${products.length} products to catalog`);
    } catch (error) {
      console.error('❌ Failed to save products:', error.message);
    }
  }

  /**
   * Generate import report
   */
  generateReport(newProducts) {
    const report = {
      timestamp: new Date().toISOString(),
      totalImported: newProducts.length,
      categories: {},
      priceRange: {
        min: Math.min(...newProducts.map(p => p.price)),
        max: Math.max(...newProducts.map(p => p.price)),
        average: (newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length).toFixed(2)
      },
      profitMargin: {
        average: (newProducts.reduce((sum, p) => {
          const margin = ((p.price - p.supplierPrice) / p.price * 100);
          return sum + margin;
        }, 0) / newProducts.length).toFixed(1)
      }
    };

    // Category breakdown
    newProducts.forEach(product => {
      report.categories[product.category] = (report.categories[product.category] || 0) + 1;
    });

    return report;
  }
}

// Run importer if called directly
async function main() {
  const apiKey = process.env.CJ_API_KEY || 'fec0d4746c244fec9fede00a6b626143';

  const importer = new CJProductImporter(apiKey);

  try {
    const newProducts = await importer.importProducts();

    if (newProducts.length > 0) {
      const report = importer.generateReport(newProducts);
      console.log('\n📊 Import Report:');
      console.log(`Total products added: ${report.totalImported}`);
      console.log(`Price range: $${report.priceRange.min} - $${report.priceRange.max}`);
      console.log(`Average profit margin: ${report.profitMargin.average}%`);
      console.log('Categories:', report.categories);
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CJProductImporter;
