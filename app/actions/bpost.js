export async function createBpostLabel(formData) {
  const apiUrl = 'https://bpost.ilxli.nl/label.php';

  // Validate input
  if (!formData || typeof formData.get !== 'function') {
    throw new Error('Invalid form data provided');
  }

  // Prepare payload with fallbacks
  const payload = {
    Name: formData.get('name') || '',
    StreetName: formData.get('streetName') || '',
    Number: formData.get('number') || '',
    Locality: formData.get('locality') || '',
    PostalCode: formData.get('postalCode') || '',
    CountryCode: formData.get('countryCode') || 'BE',
    PhoneNumber: formData.get('phoneNumber') || '+32 0 000 00 00',
    Email: formData.get('email') || '',
    OrderReference: formData.get('orderReference') || '',
    Shipping: formData.get('shipping') || 'bpack 24h pro',
  };

  try {
    console.log('Sending payload to bpost:', payload); // Debug log

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
}
