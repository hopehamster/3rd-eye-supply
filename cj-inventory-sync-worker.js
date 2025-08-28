import CJAPIClient from './cj-api-client.js';

export default {
  async fetch(request, env, ctx) {
    // This endpoint can be called manually or via cron trigger
    if (request.method !== 'POST' && request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const cjClient = new CJAPIClient(env.CJ_API_KEY);
      let processed = 0;
      let updated = 0;
      let errors = 0;

      // Get all products from your catalog (assuming stored in KV)
      const products = await this.getAllProducts(env);

      console.log(`Starting inventory sync for ${products.length} products...`);

      for (const product of products) {
        try {
          // Check if this product has CJ supplier info
          if (product.supplier === 'CJ' && product.supplierSku) {
            const availability = await cjClient.checkAvailability(product.supplierSku, 1);

            if (availability) {
              // Check if inventory or price changed
              const inventoryChanged = product.inventory !== availability.inventory;
              const priceChanged = product.supplierPrice !== availability.price;

              if (inventoryChanged || priceChanged) {
                const updatedProduct = {
                  ...product,
                  inventory: availability.inventory,
                  supplierPrice: availability.price,
                  lastInventorySync: new Date().toISOString()
                };

                await env.PRODUCTS.put(product.id, JSON.stringify(updatedProduct));
                updated++;

                console.log(`Updated ${product.name}: inventory ${product.inventory} → ${availability.inventory}, price ${product.supplierPrice} → ${availability.price}`);
              }
            } else {
              console.warn(`No availability data for SKU ${product.supplierSku}`);
              errors++;
            }
          }

          processed++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Error syncing ${product.name}:`, error);
          errors++;
        }
      }

      // Also sync from CJ's side - get updated product list
      await this.syncNewProductsFromCJ(cjClient, env);

      return new Response(JSON.stringify({
        success: true,
        processed,
        updated,
        errors,
        message: `Synced ${processed} products, ${updated} updated, ${errors} errors`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Inventory sync error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Get all products from KV storage
   */
  async getAllProducts(env) {
    const products = [];

    try {
      // List all product keys (assuming they start with 'product:')
      const listResult = await env.PRODUCTS.list({
        prefix: 'product:'
      });

      for (const key of listResult.keys) {
        try {
          const product = await env.PRODUCTS.get(key.name);
          if (product) {
            products.push(JSON.parse(product));
          }
        } catch (error) {
          console.error(`Error parsing product ${key.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error listing products:', error);
    }

    return products;
  },

  /**
   * Sync new products from CJ (products under $15)
   */
  async syncNewProductsFromCJ(cjClient, env) {
    try {
      // This would be a more complex implementation
      // For now, we'll log that this feature is available
      console.log('CJ product sync available - implement category/product search here');

      // TODO: Implement CJ product search and filtering
      // - Search for products under $15
      // - Filter by categories relevant to your store
      // - Add to PRODUCTS KV with supplier info

    } catch (error) {
      console.error('Error syncing new products from CJ:', error);
    }
  }
};
