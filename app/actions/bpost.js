'use server';
import { prisma } from '@/prisma';

export async function createBpostLabel(item) {
  // Simplified AddLabels function that matches your Prisma schema
  const AddLabels = async (data) => {
    console.log('Saving to database:', data);

    // Validate required fields
    if (!data?.order) throw new Error('Missing order number');
    if (!data?.Name) throw new Error('Missing customer name');
    if (!data?.Address) throw new Error('Missing address');
    if (!data?.orderItemId) console.warn('No orderItemId provided'); // Warn but don't fail

    try {
      return await prisma.labels.upsert({
        where: { order: data.order },
        update: {
          Name: data.Name,
          Address: data.Address,
          orderItemId: data.orderItemId, // Include orderItemId in update
          ...(data.Barcode && { Barcode: data.Barcode }),
        },
        create: {
          order: data.order,
          Name: data.Name,
          Address: data.Address,
          orderItemId: data.orderItemId, // Include orderItemId in create
          ...(data.Barcode && { Barcode: data.Barcode }),
        },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to save label: ${error.message}`);
    }
  };

  try {
    console.log('Creating label for orderItemId:', item.orderItemId);

    // Prepare the request body with fallbacks
    const requestBody = {
      Name: item.Name || '',
      StreetName: item.StreetName || '',
      Number: item.Number || '',
      Locality: item.Locality || '',
      PostalCode: item.PostalCode || '',
      CountryCode: item.CountryCode || 'BE',
      Email: item.Email || '',
      orderItemId: item.orderItemId || '', // Explicitly include even if empty
      OrderReference: item.OrderReference || item.orderId || '',
      Shipping: item.Shipping || 'PRO',
    };

    console.log('Sending to Bpost:', requestBody);

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
    console.log('API Response:', apiResponse);

    // 2. Prepare data for database
    const dbData = {
      order: apiResponse.order || item.OrderReference || '',
      Name: apiResponse.Name || item.Name || '',
      Address: [
        apiResponse.Adres || '',
        item.StreetName || '',
        item.Number || '',
        item.Locality || '',
        item.PostalCode || '',
      ]
        .filter(Boolean)
        .join(', '), // Create a more complete address
      orderItemId: item.orderItemId || '', // Pass through orderItemId
      Barcode: apiResponse.Barcode || null,
    };

    // 3. Save to database
    const dbResult = await AddLabels(dbData);
    console.log('Database result:', dbResult);

    return {
      apiResponse,
      dbResult,
      orderItemId: item.orderItemId, // Include in return value
    };
  } catch (error) {
    console.error('Error in createBpostLabel:', error);
    throw new Error(
      `Label creation failed for order ${item.OrderReference} (item ${item.orderItemId}): ${error.message}`
    );
  }
}

export async function generateBpostPdf(orderReferences) {
  try {
    if (!orderReferences || !orderReferences.length) {
      throw new Error('No order references provided');
    }

    console.log('Generating PDF for:', orderReferences);

    const response = await fetch('https://bpost.ilxli.nl/print.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        OrderReference: orderReferences,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF generation API error:', errorText);
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('PDF generated successfully');
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}
