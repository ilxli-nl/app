'use server';

export async function createBpostOrder() {
  const apiUrl = 'https://api-parcel.bpost.be/services/shm/orders';
  const accountId = '033209';
  const apiKey = 'ioNigHtWiTatOrTHRemE';
  const auth = Buffer.from(`${accountId}:${apiKey}`).toString('base64');

  const orderData = {
    reference: `ref_${Date.now()}`,
    lines: [
      {
        text: 'Article description',
        numberOfItems: 1,
      },
      {
        text: 'Some others articles',
        numberOfItems: 5,
      },
    ],
    boxes: [
      {
        nationalBox: {
          product: 'bpack 24h Pro',
          options: [
            {
              type: 'additionalInsurance',
              value: 2, // 2500 euros insurance
            },
          ],
          receiver: {
            name: 'Alma van Appel',
            address: {
              streetName: 'Rue du Grand Duc',
              number: '13',
              postalCode: '1040',
              locality: 'Etterbeek',
              countryCode: 'BE',
            },
            emailAddress: 'alma@antidot.com',
            phoneNumber: '+32 2 641 13 90',
          },
        },
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`bpost API error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create bpost order:', error);
    throw error;
  }
}
