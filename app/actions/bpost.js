'use server';

export async function createBpostLabel(formData) {
  const apiUrl = 'https://bpost.ilxli.nl/label.php';

  // Convert FormData to JSON matching your Postman structure
  const payload = {
    Name: formData.get('name'),
    StreetName: formData.get('streetName') || '',
    Number: Number(formData.get('number')) || '',
    Locality: formData.get('locality') || '',
    PostalCode: Number(formData.get('postalCode')) || '',
    CountryCode: formData.get('countryCode') || 'BE',
    PhoneNumber: formData.get('phoneNumber') || '+32 0 000 00 00',
    Email: formData.get('email') || '',
    OrderReference: formData.get('orderReference') || '',
    Shipping: formData.get('shipping') || '',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log(await response.json());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw new Error(`Label creation failed: ${error.message}`);
  }
}
