'use client';
import { useEffect, useState } from 'react';
import { getProductsAndLocations } from './actions';

export default function WarehouseDashboard() {
  const [data, setData] = useState({ products: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProductsAndLocations();
        // Ensure we always have products and locations arrays
        setData({
          products: result?.products || [],
          locations: result?.locations || [],
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className='text-center py-8'>Loading warehouse data...</div>;
  if (error) return <div className='alert alert-error'>Error: {error}</div>;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='card bg-base-200'>
        <div className='card-body'>
          <h2 className='card-title'>Products ({data.products.length})</h2>
          {data.products.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='table'>
                <thead>
                  <tr>
                    <th>EAN</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.ean}</td>
                      <td>{product.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No products registered yet.</p>
          )}
        </div>
      </div>

      <div className='card bg-base-200'>
        <div className='card-body'>
          <h2 className='card-title'>Locations ({data.locations.length})</h2>
          {data.locations.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='table'>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.locations.map((location) => (
                    <tr key={location.id}>
                      <td>{location.code}</td>
                      <td>{location.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No locations created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
