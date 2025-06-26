'use client';

import { useActionState } from 'react';
import { scanLocation } from '@/components/warehouse/actions';
import { useState } from 'react';

export default function LocationScanner() {
  const [state, formAction] = useActionState(scanLocation, null);
  const [scanMode, setScanMode] = useState(false);

  return (
    <div className='max-w-md mx-auto p-4 bg-white rounded shadow'>
      <h2 className='text-xl font-bold mb-4'>Location Scanner</h2>

      <button
        onClick={() => setScanMode(!scanMode)}
        className='mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      >
        {scanMode ? 'Exit Scan Mode' : 'Enter Scan Mode'}
      </button>

      {scanMode ? (
        <div className='mb-4 p-4 border-2 border-dashed border-indigo-300 rounded-lg'>
          <p className='text-center mb-2'>Scan a location barcode now</p>
          <form action={formAction}>
            <input
              type='text'
              id='locationCode'
              name='locationCode'
              autoFocus
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='Or enter location code manually'
            />
          </form>
        </div>
      ) : (
        <form action={formAction} className='mb-4'>
          <div>
            <label
              htmlFor='locationCode'
              className='block text-sm font-medium text-gray-700'
            >
              Location Code
            </label>
            <input
              type='text'
              id='locationCode'
              name='locationCode'
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='Enter location code (e.g., A1, B2)'
            />
          </div>
          <button
            type='submit'
            className='mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            Search Location
          </button>
        </form>
      )}

      {state?.location && (
        <div className='mt-4 p-4 bg-gray-50 rounded'>
          <h3 className='font-bold'>Location: {state.location.code}</h3>
          <p>{state.location.description || 'No description available'}</p>

          {state.products.length > 0 ? (
            <div className='mt-4'>
              <h4 className='font-bold'>Products at this location:</h4>
              <ul className='mt-2 space-y-2'>
                {state.products.map((item) => (
                  <li key={item.id} className='p-2 bg-white rounded shadow'>
                    <p className='font-medium'>{item.product.name}</p>
                    <p>EAN: {item.product.ean}</p>
                    <p>Quantity: {item.quantity}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className='mt-4 text-gray-500'>
              No products assigned to this location.
            </p>
          )}
        </div>
      )}

      {state?.error && !state?.location && (
        <p className='mt-2 text-red-600'>{state.error}</p>
      )}
    </div>
  );
}
