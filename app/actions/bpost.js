'use server';
import { prisma } from '@/prisma';

export async function createBpostLabel(item) {
  const apiUrl = 'https://bpost.ilxli.nl/label.php';

  // Simplified AddLabels function that matches your Prisma schema
  const AddLabels = async (data) => {
    console.log(data);

    // Validate required fields
    if (!data?.order) throw new Error('Missing order number');
    if (!data?.Name) throw new Error('Missing customer name');
    if (!data?.Address) throw new Error('Missing address');

    try {
      return await prisma.labels.upsert({
        where: { order: data.order },
        update: {
          Name: data.Name,
          Address: data.Address,
          ...(data.Barcode && { Barcode: data.Barcode }),
        },
        create: {
          order: data.order,
          Name: data.Name,
          Address: data.Address,
          ...(data.Barcode && { Barcode: data.Barcode }),
        },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to save label: ${error.message}`);
    }
  };

  try {
    // 1. Create bpost label
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Name: item.Name || item.customer?.name,
        StreetName: item.StreetName || item.address?.street,
        Number: item.Number || item.address?.number,
        Locality: item.Locality || item.address?.city,
        PostalCode: item.PostalCode || item.address?.postalCode,
        CountryCode: item.CountryCode || 'BE',
        Email: item.Email || item.customer?.email,
        OrderReference: item.OrderReference || item.orderId,
        Shipping: item.Shipping || item.address?.shipping || 'PRO',
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const apiResponse = await response.json();
    console.log('API Response:', apiResponse);

    // 2. Prepare data for database
    const dbData = {
      order: apiResponse.order || '',
      Name: apiResponse.Name || '',
      Address: apiResponse.Adres || '',
      Barcode: apiResponse.Barcode || null,
    };

    // 3. Save to database
    const dbResult = await AddLabels(dbData);
    console.log('Database result:', dbResult);

    return {
      apiResponse,
      dbResult,
    };
  } catch (error) {
    console.error('Error in createBpostLabel:', error);
    throw new Error(`Label creation failed: ${error.message}`);
  }
}

export async function generateBpostPdf(orderReferences) {
  try {
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
      throw new Error(`API request failed with status ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}
export async function generateBpostPdf(orderReferences) {
  try {
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
      throw new Error(`API request failed with status ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}
