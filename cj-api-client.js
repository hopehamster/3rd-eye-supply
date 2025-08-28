/**
 * CJdropshipping API Client
 * Handles authentication, product queries, and order creation
 */

class CJAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
    this.authToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate and get access token
   */
  async authenticate() {
    // CJ API uses API key directly in headers, no separate auth endpoint
    // We'll validate by making a test request
    try {
      const response = await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': this.apiKey
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.result && data.data && data.data.accessToken) {
        this.authToken = data.data.accessToken;
        // Token typically expires in 2 hours
        this.tokenExpiry = Date.now() + (2 * 60 * 60 * 1000);
        return true;
      }

      return false;
    } catch (error) {
      console.error('CJ Auth error:', error);
      return false;
    }
  }

  /**
   * Get product details by SKU/Variant ID
   */
  async getProductInfo(variantId) {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/product/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': this.authToken
        },
        body: JSON.stringify({
          productSku: variantId
        })
      });

      if (!response.ok) {
        throw new Error(`Product query failed: ${response.status}`);
      }

      const data = await response.json();
      return data.result && data.data ? data.data : null;
    } catch (error) {
      console.error('CJ Product query error:', error);
      return null;
    }
  }

  /**
   * Check product availability and price
   */
  async checkAvailability(variantId, quantity = 1) {
    const product = await this.getProductInfo(variantId);
    if (!product) return null;

    const variant = product.variants?.find(v => v.variantId === variantId);
    if (!variant) return null;

    return {
      available: variant.inventory > quantity,
      inventory: variant.inventory,
      price: parseFloat(variant.price),
      variantId: variantId
    };
  }

  /**
   * Create an order with CJ
   */
  async createOrder(orderData) {
    await this.ensureAuthenticated();

    try {
      // Transform our order data to CJ format
      const cjOrderData = {
        shippingInfo: {
          shippingMethod: orderData.shippingMethod || 'standard',
          shippingCountryCode: orderData.shippingCountryCode || 'US',
          shippingStateCode: orderData.shippingStateCode || '',
          shippingCityName: orderData.shippingCityName || '',
          shippingAddress: orderData.shippingAddress || '',
          shippingZipCode: orderData.shippingZipCode || '',
          shippingPhone: orderData.shippingPhone || '',
          shippingCustomerName: orderData.customerName || ''
        },
        productList: orderData.items.map(item => ({
          quantity: item.quantity,
          variantId: item.variantId || item.sku,
          productSku: item.sku
        }))
      };

      const response = await fetch(`${this.baseUrl}/shopping/order/createOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': this.authToken
        },
        body: JSON.stringify(cjOrderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Order creation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.result && data.data) {
        return {
          success: true,
          cjOrderId: data.data.orderId,
          trackingNumber: data.data.trackingNumber,
          status: data.data.status
        };
      } else {
        throw new Error(`Order creation failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('CJ Order creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get order tracking information
   */
  async getTracking(orderId) {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/shopping/order/getOrderInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': this.authToken
        },
        body: JSON.stringify({
          orderId: orderId
        })
      });

      if (!response.ok) {
        throw new Error(`Tracking query failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.result && data.data) {
        return {
          trackingNumber: data.data.trackingNumber,
          carrier: data.data.carrierName,
          status: data.data.status,
          trackingUrl: data.data.trackingUrl
        };
      }

      return null;
    } catch (error) {
      console.error('CJ Tracking error:', error);
      return null;
    }
  }

  /**
   * Ensure we have a valid auth token
   */
  async ensureAuthenticated() {
    if (!this.authToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Failed to authenticate with CJ API');
      }
    }
  }
}

export default CJAPIClient;
