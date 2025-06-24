'use client';

import { useActionState } from 'react';
import {
  assignProductToLocation,
  getProductsAndLocations,
} from '@/components/warehouse/actions';
import { useEffect, useState } from 'react';

export default function AssignProductForm() {
  const [state, formAction] = useActionState(assignProductToLocation, null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await getProductsAndLocations();
      if (result) {
        setProducts(result.products);
        setLocations(result.locations);
      }
    }
    fetchData();
  }, []);

  return (
    <form
      action={formAction}
      className='max-w-md mx-auto p-4 bg-white rounded shadow'
    >
      <h2 className='text-xl font-bold mb-4'>Assign Product to Location</h2>

      <div className='mb-4'>
        <label
          htmlFor='productId'
          className='block text-sm font-medium text-gray-700'
        >
          Product
        </label>
        <select
          id='productId'
          name='productId'
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        >
          <option value=''>Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (EAN: {product.ean})
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label
          htmlFor='locationId'
          className='block text-sm font-medium text-gray-700'
        >
          Location
        </label>
        <select
          id='locationId'
          name='locationId'
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        >
          <option value=''>Select a location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.code} - {location.description || 'No description'}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label
          htmlFor='quantity'
          className='block text-sm font-medium text-gray-700'
        >
          Quantity
        </label>
        <input
          type='number'
          id='quantity'
          name='quantity'
          min='1'
          defaultValue='1'
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />
      </div>

      <button
        type='submit'
        className='w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      >
        Assign Product
      </button>

      {state?.success && (
        <p className='mt-2 text-green-600'>Product assigned successfully!</p>
      )}
      {state?.error && <p className='mt-2 text-red-600'>{state.error}</p>}
    </form>
  );
}
