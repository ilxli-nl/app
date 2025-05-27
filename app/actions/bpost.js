export async function createBpostLabel(item) {
  try {
    const response = await fetch('https://api.bpost.be/shipping/labels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_API_KEY', // if needed
      },
      body: JSON.stringify({
        shipping: item.address.shipping || 'PRO',
        // other required fields
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Details:', errorData);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Full error details:', {
      error: error.message,
      stack: error.stack,
      payload: item,
      timestamp: new Date().toISOString(),
    });
    throw new Error(
      `Network error: Could not connect to bpost server. Details: ${error.message}`
    );
  }
}
