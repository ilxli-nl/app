'use client';

import { useActionState } from 'react';
import {
  assignProductToLocation,
  getProductsAndLocations,
} from '@/components/warehouse_bc/actions';
import { useState, useEffect } from 'react';

export default function AssignProductForm() {
  const [state, formAction] = useActionState(assignProductToLocation, null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getProductsAndLocations();
        if (result) {
          setProducts(result.products || []);
          setLocations(result.locations || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true);
        const result = await formAction(formData);
        setIsSubmitting(false);
        return result;
      }}
      className='max-w-md mx-auto p-4 bg-white rounded shadow'
    >
      <h2 className='text-xl font-bold mb-4'>Assign Product to Location</h2>

      <div className='mb-4'>
        <label
          htmlFor='productId'
          className='block text-sm font-medium text-gray-700'
        >
          Product*
        </label>
        <select
          id='productId'
          name='productId'
          required
          disabled={isSubmitting}
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50'
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
          Location*
        </label>
        <select
          id='locationId'
          name='locationId'
          required
          disabled={isSubmitting}
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50'
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
          Quantity*
        </label>
        <input
          type='number'
          id='quantity'
          name='quantity'
          min='1'
          defaultValue='1'
          required
          disabled={isSubmitting}
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50'
        />
      </div>

      <button
        type='submit'
        disabled={isSubmitting}
        className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? 'Assigning...' : 'Assign Product'}
      </button>

      {state?.message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            state.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
