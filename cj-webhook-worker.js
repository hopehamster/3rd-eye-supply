import CJAPIClient from './cj-api-client.js';

export default {
  async fetch(request, env, ctx) {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // 1) Verify Snipcart request via X-Snipcart-RequestToken
      const token = request.headers.get('X-Snipcart-RequestToken');
      if (!token) {
        return new Response('Missing token', { status: 400 });
      }

      const authHeader = 'Basic ' + btoa(`${env.SNIPCART_SECRET_API_KEY}:`);
      const verifyResp = await fetch(`https://app.snipcart.com/api/requestvalidation/${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      });

      if (!verifyResp.ok) {
        return new Response('Invalid signature', { status: 401 });
      }

      // 2) Read and parse payload
      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }

      const eventName = payload?.eventName || payload?.event || '';
      if (eventName !== 'order.completed') {
        return new Response('', { status: 204 });
      }

      const order = payload.content || {};
      const orderToken = order.token || order.id || crypto.randomUUID();

      // 3) Extract order details
      const items = Array.isArray(order.items)
        ? order.items.map(i => ({
            sku: i?.id || i?.sku || i?.uniqueId || '',
            name: i?.name || '',
            qty: Number(i?.quantity || i?.qty || 1),
            price: Number(i?.price || 0),
            variantId: i?.variantId || i?.id || i?.sku
          }))
        : [];

      const shippingAddress = order.shippingAddress || {};
      const billingAddress = order.billingAddress || {};

      const orderData = {
        snipcartOrderToken: orderToken,
        email: order.email || '',
        total: Number(order.finalGrandTotal ?? order.grandTotal ?? order.total ?? 0),
        items,
        shippingInfo: {
          customerName: shippingAddress.fullName || billingAddress.fullName || '',
          shippingPhone: shippingAddress.phone || '',
          shippingAddress: [
            shippingAddress.address1 || '',
            shippingAddress.address2 || ''
          ].filter(Boolean).join(', '),
          shippingCityName: shippingAddress.city || '',
          shippingStateCode: shippingAddress.province || shippingAddress.state || '',
          shippingZipCode: shippingAddress.postalCode || shippingAddress.zip || '',
          shippingCountryCode: shippingAddress.country || 'US'
        },
        status: 'received',
        supplier: 'CJ',
        createdAt: new Date().toISOString(),
      };

      // 4) Initialize CJ API client
      const cjClient = new CJAPIClient(env.CJ_API_KEY);

      // 5) Check inventory availability for all items
      const availabilityChecks = [];
      for (const item of items) {
        if (item.variantId) {
          const availability = await cjClient.checkAvailability(item.variantId, item.qty);
          availabilityChecks.push({
            item,
            available: availability?.available || false,
            inventory: availability?.inventory || 0,
            cjPrice: availability?.price || 0
          });
        }
      }

      // Check if all items are available
      const allAvailable = availabilityChecks.every(check => check.available);

      if (!allAvailable) {
        // Some items are out of stock - mark order as pending and notify
        orderData.status = 'pending_inventory';
        orderData.inventoryIssues = availabilityChecks.filter(check => !check.available);

        await env.ORDERS_STATE.put(`orders:${orderToken}`, JSON.stringify(orderData), {
          metadata: { type: 'order' },
        });

        // TODO: Send email notification about inventory issues
        return new Response('Inventory check failed', { status: 200 });
      }

      // 6) Create order with CJ
      const cjOrderData = {
        ...orderData.shippingInfo,
        shippingMethod: 'standard', // Could be configurable
        items: orderData.items
      };

      const cjOrderResult = await cjClient.createOrder(cjOrderData);

      if (cjOrderResult.success) {
        // 7) Update order record with CJ order info
        orderData.status = 'cj_order_created';
        orderData.cjOrderId = cjOrderResult.cjOrderId;
        orderData.cjTrackingNumber = cjOrderResult.trackingNumber;
        orderData.cjOrderStatus = cjOrderResult.status;

        // Store mapping for tracking
        await env.ORDERS_STATE.put(`cj_mapping:${cjOrderResult.cjOrderId}`, JSON.stringify({
          snipcartOrderToken: orderToken,
          cjOrderId: cjOrderResult.cjOrderId,
          createdAt: new Date().toISOString()
        }), {
          metadata: { type: 'mapping' },
        });
      } else {
        // CJ order creation failed
        orderData.status = 'cj_order_failed';
        orderData.cjError = cjOrderResult.error;
      }

      // 8) Save updated order record
      await env.ORDERS_STATE.put(`orders:${orderToken}`, JSON.stringify(orderData), {
        metadata: { type: 'order' },
      });

      return new Response('Order processed', { status: 200 });

    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response(`Processing error: ${error.message}`, { status: 500 });
    }
  },
};
