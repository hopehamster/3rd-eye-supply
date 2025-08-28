# CJ Dropshipping Automation Setup

This guide walks you through setting up automated dropshipping with CJdropshipping integrated into your Snipcart-powered e-commerce site.

## 🚀 Quick Overview

The automation consists of:
- **CJ API Client** (`cj-api-client.js`) - Handles CJdropshipping API integration
- **Webhook Worker** (`cj-webhook-worker.js`) - Processes Snipcart orders and creates CJ orders
- **Tracking Worker** (`cj-tracking-worker.js`) - Monitors shipping updates and sends notifications
- **Inventory Sync Worker** (`cj-inventory-sync-worker.js`) - Syncs stock levels and prices hourly
- **Product Importer** (`cj-product-importer.js`) - Adds profitable CJ products under $15 to catalog
- **Enhanced UI Components** - Shows shipping times and availability status
- **Extended Schema** - Product data includes supplier information
- **Deployment Script** (`deploy-cloudflare-workers.js`) - Automates Cloudflare deployment

## 📋 Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Snipcart Account** with a store set up
3. **CJdropshipping Account** with API access
4. **Node.js** and **Wrangler CLI** installed

### Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

## ⚙️ Step-by-Step Setup

### 1. Deploy Workers to Cloudflare

Run the deployment script:
```bash
node deploy-cloudflare-workers.js
```

This will create three workers:
- `cj-webhook` - Handles incoming Snipcart webhooks
- `cj-tracking` - Polls for tracking updates
- `cj-inventory-sync` - Syncs inventory and prices from CJ

### 2. Set Up Cloudflare KV Storage

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Storage & Databases** → **KV**
3. Click **Create namespace**
4. Name it `orders_state`
5. Copy the namespace ID

### 3. Configure Worker Environment Variables

For each worker, add these environment variables:

#### cj-webhook Worker
- `CJ_API_KEY` = `fec0d4746c244fec9fede00a6b626143`
- `SNIPCART_SECRET_API_KEY` = Your Snipcart Secret API Key
- `ORDERS_STATE` = Your KV namespace ID (from step 2)

#### cj-tracking Worker
- `CJ_API_KEY` = `fec0d4746c244fec9fede00a6b626143`
- `ORDERS_STATE` = Your KV namespace ID (from step 2)

### 4. Bind KV Namespace to Workers

For each worker:
1. Go to Worker settings → **Bindings**
2. Add KV namespace binding:
   - Name: `ORDERS_STATE`
   - Namespace: Select `orders_state`

### 5. Configure Snipcart Webhook

1. Go to [Snipcart Dashboard](https://app.snipcart.com/)
2. Navigate to **Store configurations** → **Webhooks**
3. Add webhook URL: `https://cj-webhook.your-subdomain.workers.dev/`
4. Select events: `order.completed`
5. Save changes

### 6. Set Up Cron Job for Tracking (Optional)

To automatically poll for tracking updates:

1. Go to Worker settings → **Triggers**
2. Add Cron trigger: `*/30 * * * *` (every 30 minutes)
3. Or call the tracking endpoint manually: `https://cj-tracking.your-subdomain.workers.dev/`

## 🛠️ How It Works

### Order Flow
1. **Customer places order** on your Snipcart-powered site
2. **Snipcart sends webhook** to your `cj-webhook` worker
3. **Worker validates** the webhook signature
4. **Worker checks inventory** with CJ API for each item
5. **If all items available**: Creates order with CJ
6. **Stores order data** in Cloudflare KV with CJ order ID
7. **Tracking worker polls** CJ for shipping updates
8. **Customer receives** tracking email when shipped

### Data Storage
All order data is stored in Cloudflare KV with this structure:
```
orders:{snipcartToken} -> Order data with CJ order info
cj_mapping:{cjOrderId} -> Mapping between Snipcart and CJ orders
```

## 📊 Monitoring & Debugging

### Check Worker Logs
```bash
# View webhook worker logs
wrangler tail cj-webhook

# View tracking worker logs
wrangler tail cj-tracking
```

### Inspect KV Data
Go to Cloudflare Dashboard → Storage & Databases → KV → orders_state → Explore

### Test the System
1. Place a test order on your site (use Snipcart test mode)
2. Check worker logs for processing
3. Verify KV contains order data
4. Check if CJ order was created (via CJ dashboard)

## 🔧 Customization

### Add More Suppliers
1. Create new API client (similar to `cj-api-client.js`)
2. Update webhook worker to support multiple suppliers
3. Add supplier selection logic based on product data

### Email Notifications
The tracking worker includes email notification logic. To enable:
1. Integrate with your email service (SendGrid, Mailgun, etc.)
2. Update the `sendTrackingEmail` method
3. Configure email templates and branding

### Inventory Sync
Add a scheduled worker to sync product inventory and prices:
1. Create `cj-inventory-sync-worker.js`
2. Query CJ for product updates
3. Update your product database
4. Set up cron trigger (e.g., hourly)

## 🚨 Error Handling

### Common Issues

#### Webhook Signature Invalid
- Verify `SNIPCART_SECRET_API_KEY` is correct
- Ensure webhook URL is set in TEST mode if testing

#### CJ API Authentication Failed
- Check `CJ_API_KEY` is correct
- Verify CJ account has API access enabled

#### KV Binding Not Found
- Ensure KV namespace is created and bound to worker
- Check namespace ID is correct

#### Out of Stock Items
- Worker marks order as `pending_inventory`
- Manual intervention required for backorders
- Customer should be notified

### Status Codes
- `received` - Order received from Snipcart
- `pending_inventory` - Some items out of stock
- `cj_order_created` - Successfully created CJ order
- `cj_order_failed` - CJ order creation failed
- `shipped` - Order shipped (tracking available)

## 🎯 Optional Enhancements

### Inventory Sync Worker
Automatically syncs product inventory and prices from CJ every hour:

1. **Set up cron trigger**: Go to Worker settings → **Triggers** → Add Cron trigger: `0 */1 * * *` (hourly)
2. **Configure KV binding**: Bind `PRODUCTS` namespace to store product data
3. **Monitor logs**: Check worker logs for sync results

### Product Importer
Add profitable products under $15 from CJ's catalog:

```bash
# Run the importer
node cj-product-importer.js

# Or with custom API key
CJ_API_KEY=your_key node cj-product-importer.js
```

**Features:**
- Filters products under $15 with 30%+ profit margin
- Auto-generates SEO-optimized descriptions and taglines
- Maps CJ categories to your store categories
- Avoids duplicates and provides import reports

### Enhanced UI Features

#### Lead Time Display
- Product cards show shipping time for CJ dropship items
- Product detail pages include shipping information banner
- Different indicators for in-stock, low-stock, out-of-stock, and dropship-only items

#### Extended Product Schema
Products now include supplier information:
- `supplier`: Supplier name ('CJ', 'LOCAL')
- `supplierSku`: Supplier's SKU/Product ID
- `supplierPrice`: Supplier's base price
- `leadTimeDays`: Shipping lead time in days
- `inventory`: Current inventory from supplier
- `availability`: Stock status with visual indicators

## 🎯 Next Steps

1. **Test with real orders** (start with low-value items)
2. **Set up monitoring alerts** for failed orders
3. **Configure email notifications** for customers
4. **Run inventory sync** to keep stock levels current
5. **Import CJ products** to expand your catalog
6. **Implement returns/refund handling**

## 📞 Support

- **CJdropshipping Docs**: https://developers.cjdropshipping.com/
- **Snipcart Webhooks**: https://docs.snipcart.com/webhooks
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

---

**Note**: This automation handles the core dropshipping flow but may need customization based on your specific product catalog and business rules.
