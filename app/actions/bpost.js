'use server';

export async function createBpostLabel() {
  // Configuration - match your PHP setup exactly
  const config = {
    accountId: process.env.BPOST_ACCOUNT_ID || '033209',
    apiKey: process.env.BPOST_API_KEY || 'ioNigHtWiTatOrTHRemE',
    // Note the trailing slash matches your PHP client
    apiUrl:
      process.env.BPOST_API_URL || 'https://api-parcel.bpost.be/services/shm/',
  };

  // Payload matching your PHP structure
  const orderData = {
    reference: `ref_wwerwerwerAAAA`,
    lines: [{ text: 'Article description', numberOfItems: 1 }],
    boxes: [
      {
        nationalBox: {
          product: 'bpack 24h Pro',
          options: [{ type: 'additionalInsurance', value: 2 }],
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
    const auth = Buffer.from(`${config.accountId}:${config.apiKey}`).toString(
      'base64'
    );

    // Correct endpoint construction (matches PHP client)
    const response = await fetch(`${config.apiUrl}orders`, {
      // Append 'orders' to base URL
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Label creation failed:', {
      error: error.message,
      endpoint: config.apiUrl,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Label creation failed: ${error.message}`);
  }
}
