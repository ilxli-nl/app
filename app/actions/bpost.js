'use server';
import { prisma } from '@/prisma';

export async function createBpostLabel(item) {
  // Validate input parameters
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item parameter: must be an object');
  }
  if (!item.orderItemId) {
    throw new Error('Missing required field: orderItemId');
  }

  console.log(
    'Creating label for orderItemId:',
    item.orderItemId,
    'Order:',
    item.OrderReference
  );

  const AddLabels = async (data) => {
    try {
      console.log(
        'Attempting to save to database:',
        JSON.stringify(data, null, 2)
      );

      // Validate required fields
      if (!data || typeof data !== 'object') {
        throw new Error('Database payload must be an object');
      }
      if (!data.order || typeof data.order !== 'string') {
        throw new Error('Invalid order number');
      }
      if (!data.Name || typeof data.Name !== 'string') {
        throw new Error('Invalid customer name');
      }
      if (!data.Address || typeof data.Address !== 'string') {
        throw new Error('Invalid address');
      }

      return await prisma.labels.upsert({
        where: { order: data.order },
        update: {
          Name: data.Name,
          Address: data.Address,
          orderItemId: data.orderItemId || 'UNKNOWN_ITEM',
          ...(data.Barcode && { Barcode: data.Barcode }),
        },
        create: {
          order: data.order,
          Name: data.Name,
          Address: data.Address,
          orderItemId: data.orderItemId || 'UNKNOWN_ITEM',
          ...(data.Barcode && { Barcode: data.Barcode }),
        },
      });
    } catch (error) {
      console.error('Database operation failed:', {
        error: error.message,
        stack: error.stack,
        data: data ? JSON.stringify(data, null, 2) : 'NULL_DATA',
      });
      throw new Error(`Database operation failed: ${error.message}`);
    }
  };

  try {
    // Prepare the request body with fallbacks
    const requestBody = {
      Name: item.Name || '',
      StreetName: item.StreetName || '',
      Number: item.Number || '',
      Locality: item.Locality || '',
      PostalCode: item.PostalCode || '',
      CountryCode: item.CountryCode || 'BE',
      Email: item.Email || '',
      orderItemId: item.orderItemId || '',
      OrderReference: item.OrderReference || item.orderId || '',
      Shipping: item.Shipping || 'PRO',
    };

    console.log('Sending to Bpost:', JSON.stringify(requestBody, null, 2));

    // 1. Create bpost label
    const response = await fetch(process.env.BPOST_ILXLI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bpost API Error:', errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const apiResponse = await response.json();
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error(`Invalid API response: ${JSON.stringify(apiResponse)}`);
    }

    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

    // 2. Prepare data for database
    const dbData = {
      order:
        apiResponse.order ||
        item.OrderReference ||
        'MISSING_ORDER_' + Date.now(),
      Name: apiResponse.Name || item.Name || 'MISSING_NAME',
      Address: [
        apiResponse.Adres || item.StreetName || '',
        item.Number || '',
        item.Locality || '',
        item.PostalCode || '',
      ]
        .filter(Boolean)
        .join(', '),
      orderItemId: item.orderItemId || 'MISSING_ITEM_ID',
      Barcode: apiResponse.Barcode || null,
    };

    // 3. Save to database
    console.log(
      'Preparing to save to database:',
      JSON.stringify(dbData, null, 2)
    );
    const dbResult = await AddLabels(dbData);
    console.log('Database save successful:', JSON.stringify(dbResult, null, 2));

    return {
      apiResponse,
      dbResult,
      orderItemId: item.orderItemId,
    };
  } catch (error) {
    console.error('Label creation process failed:', {
      error: error.message,
      stack: error.stack,
      item: JSON.stringify(item, null, 2),
      timestamp: new Date().toISOString(),
    });
    throw new Error(
      `Label creation failed for order ${
        item.OrderReference || 'UNKNOWN'
      } (item ${item.orderItemId || 'UNKNOWN'}): ${error.message}`
    );
  }
}

export async function generateBpostPdf(orderReferences, orderItemId) {
  try {
    if (!orderReferences || !orderReferences.length) {
      throw new Error('No order references provided');
    }
    if (!orderItemId) {
      console.warn('No orderItemId provided for PDF generation');
    }

    const references = Array.isArray(orderReferences)
      ? orderReferences
      : [orderReferences];
    console.log('Generating PDF for:', {
      orderReferences: references,
      orderItemId: orderItemId || 'NOT_PROVIDED',
    });
    console.log(orderItemId);
    const response = await fetch('https://bpost.ilxli.nl/print.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        OrderReference: references,
        orderItemId: orderItemId || null, // Send null if not provided
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF generation failed:', {
        status: response.status,
        error: errorText,
        orderReferences: references,
        orderItemId,
      });
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('PDF generated successfully for:', {
      orderReferences: references,
      orderItemId: orderItemId || 'NOT_PROVIDED',
    });
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation process failed:', {
      error: error.message,
      stack: error.stack,
      orderReferences,
      orderItemId,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
