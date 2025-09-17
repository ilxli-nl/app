'use client';

import { useActionState } from 'react';
import {
  createLocation,
  getLocationProducts,
  deleteProductFromLocation,
} from '@/components/warehouse/actions';
import { useEffect, useState } from 'react';

export default function LocationForm() {
  const [state, formAction] = useActionState(createLocation, {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchMode, setSearchMode] = useState(false);
  const [locationCode, setLocationCode] = useState('');
  const [locationProducts, setLocationProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (state?.error) {
      setError(state.message);
      setSuccess(null);
    } else if (state?.success) {
      setSuccess(state.message);
      setError(null);
    }
  }, [state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const response = await formAction(formData);

    if (response?.success) {
      event.target.reset();
    }
    setIsSubmitting(false);
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!locationCode.trim()) return;

    setIsSearching(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await getLocationProducts(locationCode);
      if (result.error) {
        setError(result.error);
        setLocationProducts([]);
      } else {
        setLocationProducts(result.products || []);
        setSuccess(`Found location: ${result.location.code}`);
      }
    } catch (error) {
      setError('Failed to fetch location data');
      setLocationProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteProduct = async (productLocationId) => {
    if (
      !confirm(
        'Are you sure you want to remove this product from the location?'
      )
    ) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteProductFromLocation(productLocationId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message);
        // Refresh the location products
        const updatedResult = await getLocationProducts(locationCode);
        setLocationProducts(updatedResult.products || []);
      }
    } catch (error) {
      setError('Failed to delete product from location');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className='max-w-lg mx-auto p-4 bg-white rounded shadow'>
      <h2 className='text-xl font-bold mb-4'>Location Management</h2>

      <div className='mb-6'>
        <button
          onClick={() => setSearchMode(!searchMode)}
          className='w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mb-4'
        >
          {searchMode
            ? 'Hide Location Search'
            : 'Search Location to Manage Products'}
        </button>

        {searchMode && (
          <div className='p-4 border border-gray-200 rounded-md'>
            <h3 className='text-lg font-medium mb-3'>
              Manage Location Products
            </h3>
            <form onSubmit={handleSearchLocation} className='mb-4'>
              <div className='mb-3'>
                <label
                  htmlFor='searchLocationCode'
                  className='block text-sm font-medium text-gray-700'
                >
                  Location Code
                </label>
                <input
                  type='text'
                  id='searchLocationCode'
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value)}
                  required
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  placeholder='Enter location code to search'
                />
              </div>
              <button
                type='submit'
                disabled={isSearching}
                className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isSearching ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSearching ? 'Searching...' : 'Search Location'}
              </button>
            </form>

            {locationProducts.length > 0 ? (
              <div className='mt-4'>
                <h4 className='font-bold mb-2'>Products at this location:</h4>
                <ul className='space-y-2'>
                  {locationProducts.map((item) => (
                    <li
                      key={item.id}
                      className='p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center'
                    >
                      <div>
                        <p className='font-medium'>{item.product.name}</p>
                        <p className='text-sm text-gray-600'>
                          EAN: {item.product.ean}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        disabled={isSearching}
                        className='bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600 disabled:opacity-50'
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : locationCode && !isSearching ? (
              <p className='text-gray-500 text-center mt-4'>
                No products found at this location.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className='border-t pt-6'>
        <h3 className='text-lg font-medium mb-4'>Add New Location</h3>

        <div className='mb-4'>
          <label
            htmlFor='code'
            className='block text-sm font-medium text-gray-700'
          >
            Location Code*
          </label>
          <input
            type='text'
            id='code'
            name='code'
            required
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
          />
        </div>

        <div className='mb-4'>
          <label
            htmlFor='description'
            className='block text-sm font-medium text-gray-700'
          >
            Description
          </label>
          <textarea
            id='description'
            name='description'
            rows={3}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
          />
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Creating...' : 'Add Location'}
        </button>
      </form>

      {/* Error Message Display */}
      {error && (
        <div className='mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md'>
          <p className='font-medium'>Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Success Message Display */}
      {success && (
        <div className='mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md'>
          <p className='font-medium'>Success:</p>
          <p>{success}</p>
        </div>
      )}
    </div>
  );
}
