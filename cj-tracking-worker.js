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

      // Get all CJ order mappings
      const mappings = await this.getAllMappings(env);

      for (const mapping of mappings) {
        try {
          const tracking = await cjClient.getTracking(mapping.cjOrderId);

          if (tracking && tracking.trackingNumber) {
            // Check if tracking has changed
            const currentOrder = await env.ORDERS_STATE.get(`orders:${mapping.snipcartOrderToken}`);

            if (currentOrder) {
              const orderData = JSON.parse(currentOrder);

              // Only update if tracking info has changed
              const hasNewTracking = !orderData.cjTrackingNumber ||
                                   orderData.cjTrackingNumber !== tracking.trackingNumber ||
                                   orderData.cjOrderStatus !== tracking.status;

              if (hasNewTracking) {
                orderData.cjTrackingNumber = tracking.trackingNumber;
                orderData.cjCarrier = tracking.carrier;
                orderData.cjTrackingUrl = tracking.trackingUrl;
                orderData.cjOrderStatus = tracking.status;
                orderData.lastTrackingUpdate = new Date().toISOString();

                await env.ORDERS_STATE.put(`orders:${mapping.snipcartOrderToken}`, JSON.stringify(orderData), {
                  metadata: { type: 'order' },
                });

                // Send tracking email if this is the first time we have tracking
                if (!orderData.cjTrackingNumber && tracking.trackingNumber) {
                  await this.sendTrackingEmail(env, orderData, tracking);
                }

                updated++;
              }
            }
          }

          processed++;

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Error processing tracking for ${mapping.cjOrderId}:`, error);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        processed,
        updated,
        message: `Processed ${processed} orders, updated ${updated} with new tracking`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Tracking worker error:', error);
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
   * Get all CJ order mappings from KV
   */
  async getAllMappings(env) {
    const mappings = [];

    // List all keys with cj_mapping: prefix
    const listResult = await env.ORDERS_STATE.list({
      prefix: 'cj_mapping:'
    });

    for (const key of listResult.keys) {
      try {
        const mapping = await env.ORDERS_STATE.get(key.name);
        if (mapping) {
          mappings.push(JSON.parse(mapping));
        }
      } catch (error) {
        console.error(`Error parsing mapping ${key.name}:`, error);
      }
    }

    return mappings;
  },

  /**
   * Send tracking email via Snipcart API
   */
  async sendTrackingEmail(env, orderData, tracking) {
    try {
      // Use Snipcart's email API to send tracking notification
      const emailData = {
        to: orderData.email,
        subject: `Your 3rd Eye Supply Order - Tracking Information`,
        body: this.generateTrackingEmailBody(orderData, tracking),
        from: 'orders@3rdeyesupply.com' // Customize this
      };

      // Snipcart doesn't have a direct email API, so we'll log for now
      // In production, you'd integrate with your email service (SendGrid, Mailgun, etc.)
      console.log('Would send tracking email:', emailData);

      // TODO: Implement actual email sending
      // const emailResponse = await fetch('https://api.emailservice.com/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(emailData)
      // });

    } catch (error) {
      console.error('Error sending tracking email:', error);
    }
  },

  /**
   * Generate tracking email body
   */
  generateTrackingEmailBody(orderData, tracking) {
    const items = orderData.items.map(item => `${item.qty}x ${item.name}`).join('\n');

    return `
Hello!

Your order #${orderData.snipcartOrderToken} has been shipped!

Order Details:
${items}

Tracking Information:
Carrier: ${tracking.carrier || 'Standard Shipping'}
Tracking Number: ${tracking.trackingNumber}
${tracking.trackingUrl ? `Track your package: ${tracking.trackingUrl}` : ''}

Status: ${tracking.status}

Thank you for shopping at 3rd Eye Supply!

Best regards,
The 3rd Eye Supply Team
    `.trim();
  }
};
