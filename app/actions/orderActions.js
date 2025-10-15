'use server';

import { prisma } from '@/prisma';

// Add these constants at the top of the file
const BOL_API_BASE = 'https://api.bol.com/';

export const Token = async (account) => {
  if (!account) throw new Error('Account is required');

  const cacheKey = `token:${account}`;
  const cachedToken = 290;
  if (cachedToken) return cachedToken;

  const response = await fetch('https://ampx.nl/token.php', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account }),
  });

  if (!response.ok) throw new Error('Token request failed');

  const result = await response.json();
  const tokenData = { token: result, account };

  return tokenData;
};

// Helper: fetch shipment list from Bol.com
async function fetchShipments(token, pages = 6) {
  const allShipments = {};
  console.log('Fetching shipments from Bol.com...');

  for (let page = 1; page <= pages; page++) {
    const res = await fetch(`${BOL_API_BASE}retailer/shipments?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.retailer.v10+json',
      },
    });

    if (!res.ok) {
      console.log(`Failed to fetch page ${page}, status: ${res.status}`);
      continue;
    }

    const json = await res.json();
    if (!json.shipments) {
      console.log(`No shipments on page ${page}`);
      continue;
    }

    console.log(`Found ${json.shipments.length} shipments on page ${page}`);

    for (const shipment of json.shipments) {
      allShipments[shipment.order.orderId] = shipment.shipmentId;
    }
  }

  console.log(`Total shipments found: ${Object.keys(allShipments).length}`);
  return allShipments;
}

// Helper: fetch a single shipment to get barcode
async function getShipmentBarcode(shipmentId, token) {
  console.log(`Fetching barcode for shipment: ${shipmentId}`);
  const res = await fetch(`${BOL_API_BASE}retailer/shipments/${shipmentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.retailer.v10+json',
    },
  });

  if (!res.ok) {
    console.log(
      `Failed to fetch shipment ${shipmentId}, status: ${res.status}`
    );
    return null;
  }

  const json = await res.json();
  const barcode = json?.transport?.trackAndTrace || null;
  console.log(`Barcode for shipment ${shipmentId}: ${barcode}`);
  return barcode;
}

// Helper: get orders that don't have barcodes in Labels table yet
async function getOrdersWithoutBarcodes(account, page = 1) {
  try {
    // Get all orders for the account
    const orders = await prisma.orders.findMany({
      where: {
        account: account,
      },
      take: 100,
      skip: (page - 1) * 100,
    });

    console.log(`Found ${orders.length} orders for account ${account}`);

    // Get existing labels to filter out orders that already have barcodes
    const existingLabels = await prisma.labels.findMany({
      where: {
        order: {
          in: orders.map((order) => order.orderId),
        },
        NOT: {
          Barcode: null,
        },
      },
    });

    const ordersWithBarcodes = new Set(
      existingLabels.map((label) => label.order)
    );
    const ordersWithoutBarcodes = orders.filter(
      (order) => !ordersWithBarcodes.has(order.orderId)
    );

    console.log(`Orders without barcodes: ${ordersWithoutBarcodes.length}`);
    return ordersWithoutBarcodes;
  } catch (error) {
    console.error('Error fetching orders without barcodes:', error);
    return [];
  }
}

// The main function - updated to update Labels table
export async function UpdateBolBarcodes(page = 1, account = 'NL') {
  try {
    console.log('Starting UpdateBolBarcodes...');

    // You'll need to import or define the Token function
    // Assuming Token is available in this file, if not you need to import it
    const token = await Token(account);

    console.log(token);
    console.log('Token obtained');

    const orders = await getOrdersWithoutBarcodes(account, page);
    console.log(`Processing ${orders.length} orders without barcodes`);

    if (orders.length === 0) {
      return {
        success: true,
        message: 'No orders found without barcodes',
        updatedCount: 0,
      };
    }

    const shipments = await fetchShipments(token.token);
    console.log(
      `Found ${Object.keys(shipments).length} shipments from Bol.com`
    );

    let updatedCount = 0;

    for (const order of orders) {
      console.log(`Processing order: ${order.orderId}`);
      const shipmentId = shipments[order.orderId];

      if (!shipmentId) {
        console.log(`No shipment found for order: ${order.orderId}`);
        continue;
      }

      const barcode = await getShipmentBarcode(shipmentId, token.token);
      if (!barcode) {
        console.log(`No barcode found for order: ${order.orderId}`);
        continue;
      }

      console.log(
        `Updating label for order: ${order.orderId} with barcode: ${barcode}`
      );

      // Update Labels table
      try {
        await prisma.labels.upsert({
          where: { order: order.orderId },
          update: {
            Barcode: barcode,
            orderItemId: order.orderItemId,
            Name: `${order.s_firstName} ${order.s_surname}`,
            Address: `${order.s_streetName} ${order.s_houseNumber}, ${order.s_zipCode} ${order.s_city}`,
          },
          create: {
            order: order.orderId,
            orderItemId: order.orderItemId,
            Name: `${order.s_firstName} ${order.s_surname}`,
            Address: `${order.s_streetName} ${order.s_houseNumber}, ${order.s_zipCode} ${order.s_city}`,
            Barcode: barcode,
          },
        });
        console.log(`Successfully updated label for order: ${order.orderId}`);
        updatedCount++;
      } catch (error) {
        console.error(
          `Error updating label for order ${order.orderId}:`,
          error
        );
      }
    }

    console.log(`Update completed. Updated ${updatedCount} labels`);

    return {
      success: true,
      message: `✅ Updated ${updatedCount} labels with barcodes`,
      updatedCount,
    };
  } catch (error) {
    console.error('UpdateBolBarcodes error:', error);
    return {
      success: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

// Regular function exports
export async function getOrders(limit = 2000) {
  try {
    const orders = await prisma.orders.findMany({
      take: limit,
      orderBy: {
        dateTimeOrderPlaced: 'desc',
      },
      select: {
        orderId: true,
        orderItemId: true,
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

    return { success: true, data: orders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: error.message };
  }
}

export async function getLabels() {
  try {
    const labels = await prisma.labels.findMany();
    return { success: true, data: labels };
  } catch (error) {
    console.error('Error fetching labels:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductImages(eans) {
  try {
    const images = await prisma.images.findMany({
      where: {
        ean: {
          in: eans.filter((ean) => ean),
        },
      },
    });
    console.log('Found images from Images table:', images.length);

    return { success: true, data: images };
  } catch (error) {
    console.error('Error fetching product images:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductImagesFromProductImage(eans) {
  try {
    const productImages = await prisma.productImage.findMany({
      where: {
        ean: {
          in: eans.filter((ean) => ean),
        },
      },
    });
    console.log('Found images from ProductImage table:', productImages.length);

    return { success: true, data: productImages };
  } catch (error) {
    console.error('Error fetching product images from ProductImage:', error);
    return { success: false, error: error.message };
  }
}

export async function updateBarcode(orderItemId, barcode) {
  try {
    console.log(
      'Updating Barcode for order item:',
      orderItemId,
      'with value:',
      barcode
    );

    const order = await prisma.orders.findUnique({
      where: { orderItemId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const existingLabel = await prisma.labels.findUnique({
      where: { order: order.orderId },
    });

    if (existingLabel) {
      const label = await prisma.labels.update({
        where: { order: order.orderId },
        data: {
          Barcode: barcode,
          orderItemId: orderItemId,
        },
      });
      return { success: true, data: label };
    } else {
      const label = await prisma.labels.create({
        data: {
          order: order.orderId,
          orderItemId: orderItemId,
          Name: `${order.s_firstName} ${order.s_surname}`,
          Address: `${order.s_streetName} ${order.s_houseNumber}, ${order.s_zipCode} ${order.s_city}`,
          Barcode: barcode,
        },
      });
      return { success: true, data: label };
    }
  } catch (error) {
    console.error('Error updating Barcode:', error);
    return { success: false, error: error.message };
  }
}
