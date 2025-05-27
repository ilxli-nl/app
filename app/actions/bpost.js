export async function createBpostLabel(item) {
  //const API_URL = 'https://api.bpost.be/services/shipping/rest'; // Verify exact endpoint
  const apiUrl = 'https://bpost.ilxli.nl/label.php';
  //const API_KEY = process.env.NEXT_PUBLIC_BPOST_API_KEY; // From environment variables

  console.dir(item);

  //  try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${API_KEY}` // Add if required
      // Add any other headers that Postman shows are needed
    },
    body: JSON.stringify({
      Name: item.Name || item.name,
      StreetName: item.StreetName || item.address?.street,
      Number: item.Number || item.address?.number,
      Locality: item.Locality || item.address?.city,
      PostalCode: item.PostalCode || item.address?.postalCode,
      CountryCode: item.CountryCode || 'BE', // Default to Belgium
      //  PhoneNumber: item.PhoneNumber || item.phone,
      Email: item.Email || item.email,
      OrderReference: item.OrderReference || item.id,
      Shipping: item.Shipping || item.address?.shipping || 'PRO',
    }),
  });

  console.log(response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return await response.json();
  // } catch (error) {
  //   console.error('Label creation failed:', {
  //     error: error.message,
  //     payload: item,
  //     timestamp: new Date().toISOString(),
  //   });
  //   throw new Error(`Failed to create label: ${error.message}`);
  // }
}
