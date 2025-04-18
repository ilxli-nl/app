'use server';

export async function createBpostLabel() {
  // 1. Use the EXACT endpoint from your PHP client
  const apiUrl = 'https://api-parcel.bpost.be/services/shm/orders';

  // 2. Authentication (match your PHP credentials exactly)
  const accountId = '033209';
  const apiKey = 'ioNigHtWiTatOrTHRemE';
  const auth = Buffer.from(`${accountId}:${apiKey}`).toString('base64');

  // 3. Payload matching your PHP structure EXACTLY
  const payload = {
    reference: `ref_EEEEEEEEE`,
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
              value: 2, // 2500€ insurance
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
        'User-Agent': 'YourApp/1.0', // Some APIs require this
      },
      body: JSON.stringify(payload),
    });

    // 4. Enhanced error handling
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Full API response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorData,
      });

      if (response.status === 403) {
        throw new Error(
          `Access denied. Verify your credentials and API permissions.`
        );
      }
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', {
      error: error.message,
      endpoint: apiUrl,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Label creation failed: ${error.message}`);
  }
}
