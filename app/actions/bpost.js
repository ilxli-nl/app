// app/actions/bpost.js
export async function createBpostLabel(formData) {
  const apiUrl = 'https://bpost.ilxli.nl/label.php';

  console.log('API Configuration:', {
    apiUrl: apiUrl ? `${apiUrl.substring(0, 20)}...` : 'MISSING',
  });

  if (!apiUrl) {
    throw new Error('BPOST_API_URL is not defined in environment variables');
  }

  try {
    const payload = {
      name: formData.get('name'),
      streetName: formData.get('streetName'),
      number: formData.get('number'),
      locality: formData.get('locality'),
      postalCode: formData.get('postalCode'),
      countryCode: formData.get('countryCode'),
      phoneNumber: formData.get('phoneNumber'),
      email: formData.get('email'),
      orderReference: formData.get('orderReference'),
      shipping: formData.get('shipping'),
    };

    console.log('Request Payload:', payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Full Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: error instanceof TypeError ? 'Network/Type Error' : 'Other Error',
    });

    if (error.name === 'AbortError') {
      throw new Error('Request timed out (10 seconds)');
    } else if (error.name === 'TypeError') {
      throw new Error(
        `Network error: ${error.message}. Check API URL and connectivity.`
      );
    }

    throw new Error(`Label creation failed: ${error.message}`);
  }
}
