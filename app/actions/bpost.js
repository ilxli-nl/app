'use server';

export async function createBpostLabel() {
  const apiUrl = 'https://api-parcel.bpost.be/services/shm/orders';
  const auth = Buffer.from(
    `${process.env.BPOST_ACCOUNT_ID}:${process.env.BPOST_API_KEY}`
  ).toString('base64');

  const payload = {
    orderReference: `ORDER_${Date.now()}`,
    sender: {
      name: 'Your Shop',
      address: {
        street: 'Shop Street 1',
        postalCode: '1000',
        locality: 'Brussels',
        country: 'BE',
      },
    },
    recipient: {
      name: 'Customer Name',
      address: {
        street: 'Customer Street 2',
        postalCode: '2000',
        locality: 'Antwerp',
        country: 'BE',
      },
    },
    parcels: [
      {
        weight: 750, // 750 grams
      },
    ],
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`bpost error: ${error.message || 'Unknown error'}`);
  }

  return await response.json();
}
