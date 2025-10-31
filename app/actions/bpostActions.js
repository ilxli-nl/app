// app/actions/bpostActions.js
'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createBpostShipment(formData) {
  try {
    const orderItemId = formData.get('orderItemId');
    const productType = formData.get('productType') || 'BPACK_24H_PRO';

    console.log('Creating Bpost shipment for:', orderItemId);

    // Get order details from database
    const order = await prisma.orders.findUnique({
      where: { orderItemId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Prepare Bpost API request
    const bpostData = {
      orderItemId: order.orderItemId,
      OrderReference: order.orderId,
      Name: `${order.s_firstName} ${order.s_surname}`,
      StreetName: order.s_streetName,
      Number: order.s_houseNumber + (order.s_houseNumberExtension || ''),
      PostalCode: order.s_zipCode,
      Locality: order.s_city,
      CountryCode: order.s_countryCode,
      Email: order.email,
      Shipping: productType.includes('BPACK_BUSINESS') ? 'BP' : 'PRO',
      PhoneNumber: '', // Add if available
    };

    console.log('Sending to Bpost API:', bpostData);

    // Call Bpost API - using your PHP endpoint
    const response = await fetch(
      process.env.BPOST_API_URL || 'https://bpost.ilxli.nl/label.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bpostData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bpost API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.Message !== 'Success') {
      throw new Error(
        'Bpost API returned error: ' + (result.Message || 'Unknown error')
      );
    }

    // Save label to database
    const labelData = {
      order: result.order || order.orderId,
      Name: result.Name || bpostData.Name,
      Address:
        result.Adres ||
        `${bpostData.StreetName} ${bpostData.Number}, ${bpostData.PostalCode} ${bpostData.Locality}`,
      orderItemId: order.orderItemId,
      Barcode: result.Barcode || `BPOST-${Date.now()}`,
    };

    await prisma.labels.upsert({
      where: { orderItemId: order.orderItemId },
      update: labelData,
      create: labelData,
    });

    return {
      success: true,
      message: 'Bpost shipment created successfully',
      barcode: labelData.Barcode,
      orderReference: labelData.order,
    };
  } catch (error) {
    console.error('Error creating Bpost shipment:', error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function completeBolOrder(formData) {
  try {
    const orderItemId = formData.get('orderItemId');
    const trackingNumber = formData.get('trackingNumber');

    // Get Bol.com API token
    const tokenRecord = await prisma.token.findFirst();
    if (!tokenRecord?.dbtoken) {
      return { success: false, error: 'No Bol.com API token found' };
    }

    // Send shipment to Bol.com
    const shipmentData = {
      orderItems: [
        {
          orderItemId: orderItemId,
          shipmentReference: trackingNumber,
        },
      ],
      transport: {
        transporterCode: 'BPOST',
        trackAndTrace: trackingNumber,
      },
    };

    const response = await fetch(
      'https://api.bol.com/retailer/public/shipments',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenRecord.dbtoken}`,
          Accept: 'application/vnd.retailer.v10+json',
          'Content-Type': 'application/vnd.retailer.v10+json',
        },
        body: JSON.stringify(shipmentData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bol API error: ${response.status} - ${errorText}`);
    }

    // Update order as fulfilled
    await prisma.orders.update({
      where: { orderItemId },
      data: { fulfilled: 'true' },
    });

    return {
      success: true,
      message: 'Order completed on Bol.com successfully',
    };
  } catch (error) {
    console.error('Error completing Bol order:', error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}
