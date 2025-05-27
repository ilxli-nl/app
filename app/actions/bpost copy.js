export async function createBpostLabel(data) {
  const apiUrl = 'https://bpost.ilxli.nl/label.php';

  //console.log(data.selectedItems);

  const label = await data.selectedItems;

  label.map(async (item) => {
    const payload = {
      Name: item.address.name || '',
      StreetName: item.address.StreetName || '',
      Number: item.address.houseNumber || '',
      Locality: item.address.Locality || '',
      PostalCode: item.address.PostalCode || '',
      CountryCode: item.address.CountryCode || 'BE',
      //PhoneNumber: item.address.get('phoneNumber') || '+32 0 000 00 00',
      Email: item.address.Email || '',
      OrderReference: 'TEST' + item.address.OrderReference || '',
      Shipping: item.address.shipping || 'PRO', //'bpack 24h pro',
    };

    console.log(payload);

    try {
      // console.log('Sending payload to bpost:', payload); // Debug log

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        //credentials: 'include', // Include cookies if needed
      });

      console.log('Received response status:', response.status); // Debug log

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Failed to read error response';
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      try {
        const data = await response.json();
        console.log('API response data:', data); // Debug log
        return data;
      } catch (e) {
        console.warn('Failed to parse JSON response, returning text');
        return { success: true, rawResponse: await response.text() };
      }
    } catch (error) {
      console.error('Full API error:', {
        error: error.message,
        stack: error.stack,
        payload,
        timestamp: new Date().toISOString(),
      });

      // More specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Could not connect to bpost server');
      }
      throw error;
    }
  });

  // Prepare payload with fallbacks
  // const payload = {
  //   Name: item.address.get('name') || '',
  //   StreetName: item.address.get('streetName') || '',
  //   Number: item.address.get('number') || '',
  //   Locality: item.address.get('locality') || '',
  //   PostalCode: item.address.get('postalCode') || '',
  //   CountryCode: item.address.get('countryCode') || 'BE',
  //   PhoneNumber: item.address.get('phoneNumber') || '+32 0 000 00 00',
  //   Email: item.address.get('email') || '',
  //   OrderReference: item.address.get('orderReference') || '',
  //   Shipping: item.address.get('shipping') || 'bpack 24h pro',
  // };

  // try {
  //   console.log('Sending payload to bpost:', payload); // Debug log

  //   const response = await fetch(apiUrl, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(payload),
  //     //credentials: 'include', // Include cookies if needed
  //   });

  //   console.log('Received response status:', response.status); // Debug log

  //   if (!response.ok) {
  //     let errorText;
  //     try {
  //       errorText = await response.text();
  //     } catch (e) {
  //       errorText = 'Failed to read error response';
  //     }
  //     throw new Error(`HTTP ${response.status}: ${errorText}`);
  //   }

  //   try {
  //     const data = await response.json();
  //     console.log('API response data:', data); // Debug log
  //     return data;
  //   } catch (e) {
  //     console.warn('Failed to parse JSON response, returning text');
  //     return { success: true, rawResponse: await response.text() };
  //   }
  // } catch (error) {
  //   console.error('Full API error:', {
  //     error: error.message,
  //     stack: error.stack,
  //     payload,
  //     timestamp: new Date().toISOString(),
  //   });

  //   // More specific error messages
  //   if (error.message.includes('Failed to fetch')) {
  //     throw new Error('Network error: Could not connect to bpost server');
  //   }
  //   throw error;
  // }
}
