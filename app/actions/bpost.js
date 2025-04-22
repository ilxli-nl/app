'use server';

export async function createBpostLabel(formData) {
  const apiUrl = 'https://bpost.ilxli.nl/label.php';

  // Convert FormData to JSON matching your Postman structure
  const payload = {
    Name: formData.get('name') || 'BBBBBBBBBBBBBBBB',
    StreetName: formData.get('streetName') || 'Rue du Grand Duc',
    Number: Number(formData.get('number')) || 13,
    Locality: formData.get('locality') || 'Etterbeek',
    PostalCode: Number(formData.get('postalCode')) || 1040,
    CountryCode: formData.get('countryCode') || 'BE',
    PhoneNumber: formData.get('phoneNumber') || '+32 2 641 13 90',
    Email: formData.get('email') || 'alma@antidot.com',
    OrderReference: formData.get('orderReference') || 'BBBBBBBBBBBBBBBB',
    Shipping: formData.get('shipping') || 'PRO',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

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
