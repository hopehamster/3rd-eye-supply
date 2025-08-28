#!/usr/bin/env node

/**
 * Cloudflare Workers Deployment Script
 * Deploys CJ dropshipping automation workers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deployWorkers() {
  console.log('🚀 Deploying CJ Dropshipping Workers to Cloudflare...\n');

  // Check if wrangler is installed
  try {
    execSync('wrangler --version', { stdio: 'ignore' });
  } catch {
    console.error('❌ Wrangler CLI not found. Install with: npm install -g wrangler');
    process.exit(1);
  }

  // Check if logged in
  try {
    execSync('wrangler whoami', { stdio: 'ignore' });
  } catch {
    console.error('❌ Not logged in to Cloudflare. Run: wrangler login');
    process.exit(1);
  }

  const workers = [
    {
      name: 'cj-webhook',
      file: 'cj-webhook-worker.js',
      description: 'Processes Snipcart webhooks and creates CJ orders'
    },
    {
      name: 'cj-tracking',
      file: 'cj-tracking-worker.js',
      description: 'Polls CJ for tracking updates and sends notifications'
    },
    {
      name: 'cj-inventory-sync',
      file: 'cj-inventory-sync-worker.js',
      description: 'Syncs inventory and prices from CJ hourly'
    }
  ];

  for (const worker of workers) {
    console.log(`📦 Deploying ${worker.name}...`);

    try {
      // Create wrangler.toml for this worker
      // Configure KV namespaces based on worker needs
      const kvNamespaces = worker.name === 'cj-inventory-sync' ? `
[[kv_namespaces]]
binding = "ORDERS_STATE"
id = "e2b14ff2ea19401f9f4211540ddf3f6e"

[[kv_namespaces]]
binding = "PRODUCTS"
id = "068e6599412e40659fd403e54f5fac55"` : `
[[kv_namespaces]]
binding = "ORDERS_STATE"
id = "e2b14ff2ea19401f9f4211540ddf3f6e"`;

      const wranglerConfig = `
name = "${worker.name}"
main = "${worker.file}"
compatibility_date = "2024-01-01"

[vars]
CJ_API_KEY = "fec0d4746c244fec9fede00a6b626143"
${kvNamespaces}

# Uncomment and configure these when you have the values
# [vars]
# SNIPCART_SECRET_API_KEY = "your_snipcart_secret_key"
# SNIPCART_WEBHOOK_SECRET = "your_webhook_secret"

# For webhook worker only
# [[triggers]]
# type = "webhook"
# zone = "your-zone-id"
      `.trim();

      fs.writeFileSync(`wrangler-${worker.name}.toml`, wranglerConfig);

      // Deploy the worker
      execSync(`wrangler deploy --config wrangler-${worker.name}.toml`, {
        stdio: 'inherit'
      });

      console.log(`✅ ${worker.name} deployed successfully!\n`);

      // Clean up config file
      fs.unlinkSync(`wrangler-${worker.name}.toml`);

    } catch (error) {
      console.error(`❌ Failed to deploy ${worker.name}:`, error.message);
    }
  }

  console.log('🎉 Deployment complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up KV namespace binding in Cloudflare dashboard');
  console.log('2. Configure environment variables (SNIPCART_SECRET_API_KEY, etc.)');
  console.log('3. Set up webhook URL in Snipcart dashboard');
  console.log('4. Test with a sample order');
}

// Run if called directly
if (require.main === module) {
  deployWorkers().catch(console.error);
}

module.exports = { deployWorkers };
