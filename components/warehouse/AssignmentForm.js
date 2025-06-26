'use client';
import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { assignProductToLocation, getProductsAndLocations } from './actions';

export default function AssignmentForm() {
  const [state, formAction] = useFormState(assignProductToLocation, null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProductsAndLocations();
        setProducts(data.products);
        setLocations(data.locations);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className='card bg-base-200'>
      <div className='card-body'>
        <h2 className='card-title'>Assign Product to Location</h2>

        {state?.success && (
          <div className='alert alert-success'>{state.message}</div>
        )}

        {state?.error && (
          <div className='alert alert-error'>{state.message}</div>
        )}

        <form action={formAction}>
          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Select Product</span>
            </label>
            <select
              name='productId'
              className='select select-bordered'
              required
            >
              <option value=''>Choose a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.ean})
                </option>
              ))}
            </select>
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Select Location</span>
            </label>
            <select
              name='locationId'
              className='select select-bordered'
              required
            >
              <option value=''>Choose a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.description}
                </option>
              ))}
            </select>
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Quantity</span>
            </label>
            <input
              type='number'
              name='quantity'
              min='1'
              defaultValue='1'
              className='input input-bordered'
              required
            />
          </div>

          <div className='form-control mt-6'>
            <button type='submit' className='btn btn-primary'>
              Assign Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
