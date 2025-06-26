'use client';
import { useState } from 'react';

export default function Scanner({ mode, onSubmit, result, onModeChange }) {
  const [scanValue, setScanValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (mode === 'location') {
      formData.append('locationCode', scanValue);
    } else {
      formData.append('productEan', scanValue);
    }
    onSubmit(formData);
    setScanValue('');
  };

  if (!mode) {
    return (
      <div className='card bg-base-200'>
        <div className='card-body'>
          <h2 className='card-title'>Scanner Mode</h2>
          <p>Select what you want to scan:</p>
          <div className='flex gap-4 mt-4'>
            <button
              className='btn btn-primary'
              onClick={() => onModeChange('location')}
            >
              Scan Location
            </button>
            <button
              className='btn btn-secondary'
              onClick={() => onModeChange('product')}
            >
              Scan Product
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='card bg-base-200'>
      <div className='card-body'>
        <h2 className='card-title'>
          {mode === 'location' ? 'Location Scanner' : 'Product Scanner'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>
                {mode === 'location' ? 'Location Code' : 'Product EAN'}
              </span>
            </label>
            <input
              type='text'
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              className='input input-bordered'
              placeholder={
                mode === 'location'
                  ? 'Scan location barcode'
                  : 'Scan product barcode'
              }
              autoFocus
            />
          </div>

          <div className='form-control mt-6'>
            <button type='submit' className='btn btn-primary'>
              Scan
            </button>
          </div>
        </form>

        {result?.error && (
          <div className='alert alert-error mt-4'>{result.error}</div>
        )}

        {result?.location && (
          <div className='mt-6'>
            <h3 className='text-lg font-semibold'>Location Details</h3>
            <p>
              <strong>Code:</strong> {result.location.code}
            </p>
            <p>
              <strong>Description:</strong> {result.location.description}
            </p>

            {result.products?.length > 0 ? (
              <div className='mt-4'>
                <h4 className='font-medium'>Products at this location:</h4>
                <ul className='list-disc pl-5'>
                  {result.products.map((product, index) => (
                    <li key={index}>
                      {product.product.name} (Qty: {product.quantity})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className='mt-4'>No products assigned to this location.</p>
            )}
          </div>
        )}

        {result?.product && (
          <div className='mt-6'>
            <h3 className='text-lg font-semibold'>Product Details</h3>
            <div className='flex gap-4'>
              {result.product.imageUrl && (
                <img
                  src={result.product.imageUrl}
                  alt={result.product.name}
                  className='w-32 h-32 object-contain'
                />
              )}
              <div>
                <p>
                  <strong>EAN:</strong> {result.product.ean}
                </p>
                <p>
                  <strong>Name:</strong> {result.product.name}
                </p>
                <p>
                  <strong>Description:</strong> {result.product.description}
                </p>
              </div>
            </div>

            {result.locations?.length > 0 ? (
              <div className='mt-4'>
                <h4 className='font-medium'>Locations with this product:</h4>
                <ul className='list-disc pl-5'>
                  {result.locations.map((location, index) => (
                    <li key={index}>
                      {location.location.code} (Qty: {location.quantity})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className='mt-4'>
                This product is not assigned to any locations.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
