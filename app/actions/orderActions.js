'use server';

import { prisma } from '@/prisma';

const BOL_API_BASE = 'https://api.bol.com/';
const IMAGE_CACHE_TTL = 1000 * 60 * 5;

// --- Cache class for tokens ---
class TTLCache {
  constructor(ttl = IMAGE_CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }
}

const tokenCache = new TTLCache();

// --- Fetch token ---
export const Token = async (account) => {
  if (!account) throw new Error('Account is required');

  const cacheKey = `token:${account}`;
  const cached = tokenCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch('https://ampx.nl/token.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ account }),
  });

  if (!res.ok) throw new Error('Token request failed');
  const result = await res.json();
  const tokenData = { token: result, account };
  tokenCache.set(cacheKey, tokenData);
  return tokenData;
};

export async function getOrderWithLabel(orderItemId) {
  try {
    console.log('Fetching order with label for:', orderItemId);

    const order = await prisma.orders.findUnique({
      where: { orderItemId },
    });

    if (!order) {
      console.log('Order not found for orderItemId:', orderItemId);
      return { success: false, error: 'Order not found' };
    }

    const label = await prisma.labels.findUnique({
      where: { orderItemId },
    });

    console.log(
      'Found order:',
      order.orderId,
      'label:',
      label ? 'exists' : 'not found'
    );

    return {
      success: true,
      order,
      label: label || null,
    };
  } catch (error) {
    console.error('Error in getOrderWithLabel:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// --- Fetch shipments with better debugging ---
async function fetchShipments(token, pages = 6) {
  const allShipments = {};
  console.log('🔍 Fetching shipments from Bol.com...');

  for (let page = 1; page <= pages; page++) {
    try {
      const res = await fetch(
        `${BOL_API_BASE}retailer/shipments?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.retailer.v10+json',
          },
        }
      );

      if (!res.ok) {
        console.log(`❌ Page ${page} failed: ${res.status}`);
        continue;
      }

      const json = await res.json();

      if (!json.shipments || !Array.isArray(json.shipments)) {
        console.log(`📭 No shipments array on page ${page}`);
        continue;
      }

      console.log(
        `✅ Found ${json.shipments.length} shipments on page ${page}`
      );

      for (const shipment of json.shipments) {
        const orderId = shipment?.order?.orderId;
        if (orderId && shipment.shipmentId) {
          allShipments[orderId] = shipment.shipmentId;
          console.log(`✅ Mapped: ${orderId} -> ${shipment.shipmentId}`);
        } else {
          console.log('❌ Could not extract orderId from shipment:', shipment);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching page', page, err);
    }
  }

  console.log(`📊 Total shipments found: ${Object.keys(allShipments).length}`);
  return allShipments;
}

// --- Fetch single shipment barcode ---
async function getShipmentBarcode(shipmentId, token) {
  try {
    console.log(`🔍 Fetching barcode for shipment: ${shipmentId}`);
    const res = await fetch(`${BOL_API_BASE}retailer/shipments/${shipmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.retailer.v10+json',
      },
    });

    if (!res.ok) {
      console.log(`❌ Failed to fetch shipment ${shipmentId}: ${res.status}`);
      return null;
    }

    const json = await res.json();
    const barcode = json?.transport?.trackAndTrace || null;
    console.log(`📦 Barcode for ${shipmentId}: ${barcode}`);
    return barcode;
  } catch (error) {
    console.error(`❌ Error fetching barcode for ${shipmentId}:`, error);
    return null;
  }
}

// --- Get orders without barcodes ---
async function getOrdersWithoutBarcodes(account, page = 1) {
  try {
    const orders = await prisma.orders.findMany({
      where: { account },
      take: 100,
      skip: (page - 1) * 100,
    });

    console.log(`📦 Found ${orders.length} orders for account ${account}`);

    const existingLabels = await prisma.labels.findMany({
      where: {
        orderItemId: {
          in: orders.map((o) => o.orderItemId),
        },
        NOT: { Barcode: null },
      },
    });

    console.log(
      `🏷️ Found ${existingLabels.length} existing labels with barcodes`
    );

    const labeledItems = new Set(existingLabels.map((l) => l.orderItemId));
    const ordersWithoutBarcodes = orders.filter(
      (o) => !labeledItems.has(o.orderItemId)
    );

    console.log(`🆕 Orders without barcodes: ${ordersWithoutBarcodes.length}`);
    return ordersWithoutBarcodes;
  } catch (error) {
    console.error('❌ Error getting orders without barcodes:', error);
    return [];
  }
}

// --- Update or create barcode ---
export async function updateBarcode(orderItemId, barcode) {
  try {
    console.log(
      `💾 Updating barcode for orderItemId: ${orderItemId} with: ${barcode}`
    );

    const order = await prisma.orders.findUnique({ where: { orderItemId } });
    if (!order) {
      console.log(`❌ Order not found for orderItemId: ${orderItemId}`);
      return { success: false, error: 'Order not found' };
    }

    const label = await prisma.labels.upsert({
      where: { orderItemId },
      update: {
        Barcode: barcode,
        Name: `${order.s_firstName} ${order.s_surname}`,
        Address: `${order.s_streetName} ${order.s_houseNumber}, ${order.s_zipCode} ${order.s_city}`,
        order: order.orderId,
      },
      create: {
        orderItemId,
        order: order.orderId,
        Name: `${order.s_firstName} ${order.s_surname}`,
        Address: `${order.s_streetName} ${order.s_houseNumber}, ${order.s_zipCode} ${order.s_city}`,
        Barcode: barcode,
      },
    });

    console.log(`✅ Label updated for orderItemId ${orderItemId}`);
    return { success: true, data: label };
  } catch (error) {
    console.error('❌ Error updating barcode:', error);
    return { success: false, error: error.message };
  }
}

// --- Manual sync for specific order IDs ---
export async function syncSpecificOrders(orderIds, account = 'NL') {
  try {
    console.log('🔧 Manual sync for specific orders:', orderIds);

    const token = await Token(account);
    const shipments = await fetchShipments(token.token);

    let updatedCount = 0;

    for (const orderId of orderIds) {
      console.log(`🔍 Checking order: ${orderId}`);

      if (!shipments[orderId]) {
        console.log(`❌ No shipment found for: ${orderId}`);
        continue;
      }

      const shipmentId = shipments[orderId];
      const barcode = await getShipmentBarcode(shipmentId, token.token);

      if (!barcode) {
        console.log(`❌ No barcode for: ${orderId}`);
        continue;
      }

      // Find the order in database
      const order = await prisma.orders.findFirst({
        where: { orderId },
      });

      if (!order) {
        console.log(`❌ Order not found in database: ${orderId}`);
        continue;
      }

      const result = await updateBarcode(order.orderItemId, barcode);
      if (result.success) {
        updatedCount++;
        console.log(`✅ Successfully synced: ${orderId}`);
      }
    }

    return {
      success: true,
      message: `Manually synced ${updatedCount} orders`,
      updatedCount,
    };
  } catch (error) {
    console.error('Manual sync error:', error);
    return {
      success: false,
      message: `Manual sync failed: ${error.message}`,
      updatedCount: 0,
    };
  }
}

// --- Main sync function with comprehensive logging ---
export async function UpdateBolBarcodes(page = 1, account = 'NL') {
  try {
    console.log('🚀 Starting UpdateBolBarcodes...');

    const token = await Token(account);
    console.log('✅ Token obtained');

    // Get ALL orders (not just those without barcodes) to see what we have
    const allOrders = await prisma.orders.findMany({
      where: { account },
      take: 200,
      orderBy: { dateTimeOrderPlaced: 'desc' },
      select: {
        orderId: true,
        orderItemId: true,
        dateTimeOrderPlaced: true,
        s_firstName: true,
        s_surname: true,
      },
    });

    console.log(`📦 Found ${allOrders.length} total orders in database`);

    if (allOrders.length === 0) {
      return {
        success: false,
        message: 'No orders found in database',
        updatedCount: 0,
      };
    }

    // Show recent orders
    console.log('📋 Recent orders in database (last 10):');
    allOrders.slice(0, 10).forEach((order) => {
      console.log(
        `   - ${order.orderId} (${order.dateTimeOrderPlaced}) - ${order.s_firstName} ${order.s_surname}`
      );
    });

    const shipments = await fetchShipments(token.token);

    if (Object.keys(shipments).length === 0) {
      console.log('❌ No shipments found from Bol.com');
      return {
        success: false,
        message: 'No shipments found from Bol.com',
        updatedCount: 0,
      };
    }

    console.log(
      '📦 Shipments found from Bol.com:',
      Object.keys(shipments).length
    );
    console.log(
      '🔍 Recent shipment order IDs (last 10):',
      Object.keys(shipments).slice(0, 10)
    );

    // Check for ANY matches between our orders and shipments
    let updatedCount = 0;
    let matchedOrders = [];

    for (const order of allOrders) {
      if (shipments[order.orderId]) {
        matchedOrders.push(order);
        console.log(`✅ MATCH FOUND: ${order.orderId} has shipment!`);
      }
    }

    console.log(
      `🎯 Found ${matchedOrders.length} matching orders out of ${allOrders.length} total orders`
    );

    // Process matching orders
    for (const order of matchedOrders) {
      const shipmentId = shipments[order.orderId];
      console.log(
        `🔍 Processing order: ${order.orderId} with shipment: ${shipmentId}`
      );

      const barcode = await getShipmentBarcode(shipmentId, token.token);
      if (!barcode) {
        console.log(`❌ No barcode found for order: ${order.orderId}`);
        continue;
      }

      console.log(`✅ Found barcode: ${barcode} for order: ${order.orderId}`);

      const result = await updateBarcode(order.orderItemId, barcode);
      if (result.success) {
        updatedCount++;
        console.log(`🎉 Successfully updated order: ${order.orderId}`);
      } else {
        console.log(
          `❌ Failed to update order: ${order.orderId} - ${result.error}`
        );
      }
    }

    // Analysis of the mismatch
    if (matchedOrders.length === 0) {
      console.log('\n🔍 ANALYSIS: Why no matches?');
      console.log('   - Database orders might be too old or too new');
      console.log('   - Orders might not be shipped yet');
      console.log('   - Different Bol.com account?');
      console.log('   - Order ID format mismatch');

      // Check if there are any partial matches or similar patterns
      const dbOrderIds = allOrders.map((o) => o.orderId);
      const shipmentIds = Object.keys(shipments);

      // Look for any partial matches (first few characters)
      let partialMatches = 0;
      dbOrderIds.forEach((dbId) => {
        shipmentIds.forEach((shipId) => {
          if (dbId.substring(0, 6) === shipId.substring(0, 6)) {
            partialMatches++;
            console.log(`   ⚠️ Partial match: ${dbId} vs ${shipId}`);
          }
        });
      });

      if (partialMatches > 0) {
        console.log(`   🔍 Found ${partialMatches} partial order ID matches`);
      }
    }

    const message =
      matchedOrders.length > 0
        ? `Updated ${updatedCount} labels with barcodes`
        : `No matching orders found. Check if orders are shipped or account mismatch.`;

    return {
      success: updatedCount > 0,
      message,
      updatedCount,
      analysis: {
        totalOrders: allOrders.length,
        totalShipments: Object.keys(shipments).length,
        matchedOrders: matchedOrders.length,
        updatedOrders: updatedCount,
      },
    };
  } catch (error) {
    console.error('❌ UpdateBolBarcodes error:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      updatedCount: 0,
    };
  }
}

// --- Get orders with product images ---
export async function getOrders(limit = 2000) {
  try {
    const orders = await prisma.orders.findMany({
      take: limit,
      orderBy: { dateTimeOrderPlaced: 'desc' },
      select: {
        orderId: true,
        orderItemId: true,
        account: true,
        s_firstName: true,
        s_surname: true,
        s_streetName: true,
        s_houseNumber: true,
        s_zipCode: true,
        s_city: true,
        s_countryCode: true,
        title: true,
        quantity: true,
        unitPrice: true,
        qls_time: true,
        ean: true,
        img: true,
      },
    });

    // Get product images for orders that have EANs
    const eans = [
      ...new Set(orders.map((order) => order.ean).filter((ean) => ean)),
    ];
    let productImagesMap = {};

    if (eans.length > 0) {
      // Try Images table first
      const imagesResult = await getProductImages(eans);
      if (imagesResult.success) {
        imagesResult.data.forEach((image) => {
          productImagesMap[image.ean] = image.image;
        });
      } else {
        // Fallback to ProductImage table
        const productImagesResult = await getProductImagesFromProductImage(
          eans
        );
        if (productImagesResult.success) {
          productImagesResult.data.forEach((image) => {
            productImagesMap[image.ean] = image.imageUrl;
          });
        }
      }
    }

    // Add image URLs to orders
    const ordersWithImages = orders.map((order) => ({
      ...order,
      productImage: order.ean ? productImagesMap[order.ean] : null,
      orderImage: order.img,
    }));

    return { success: true, data: ordersWithImages };
  } catch (e) {
    console.error('Error fetching orders:', e);
    return { success: false, error: e.message };
  }
}

// --- Get all labels ---
export async function getLabels() {
  try {
    const labels = await prisma.labels.findMany();
    return { success: true, data: labels };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- Get product images ---
export async function getProductImages(eans) {
  try {
    const images = await prisma.images.findMany({
      where: { ean: { in: eans.filter(Boolean) } },
    });
    return { success: true, data: images };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- Get product images from ProductImage table ---
export async function getProductImagesFromProductImage(eans) {
  try {
    const images = await prisma.productImage.findMany({
      where: { ean: { in: eans.filter(Boolean) } },
    });
    return { success: true, data: images };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
