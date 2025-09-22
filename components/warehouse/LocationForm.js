'use client';

import { useActionState } from 'react';
import {
  createLocation,
  getLocationProducts,
  deleteProductFromLocation,
} from '@/components/warehouse/actions';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LocationForm() {
  const [state, formAction] = useActionState(createLocation, {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchMode, setSearchMode] = useState(false);
  const [locationCode, setLocationCode] = useState('');
  const [locationProducts, setLocationProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);

  useEffect(() => {
    if (state?.error) {
      setError(state.message);
      setSuccess(null);
    } else if (state?.success) {
      setSuccess(state.message);
      setError(null);
      // Reset form on success
      document.getElementById('location-form')?.reset();
    }
  }, [state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    await formAction(formData);

    setIsSubmitting(false);
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!locationCode.trim()) return;

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    setLocationDetails(null);

    try {
      const result = await getLocationProducts(locationCode);
      if (result.error) {
        setError(result.error);
        setLocationProducts([]);
        setLocationDetails(null);
      } else {
        setLocationProducts(result.products || []);
        setLocationDetails(result.location);
        setSuccess(
          `Found location: ${result.location.code} - ${
            result.location.description || 'No description'
          }`
        );
      }
    } catch (error) {
      setError('Failed to fetch location data');
      setLocationProducts([]);
      setLocationDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteProduct = async (productLocationId, productName) => {
    if (
      !confirm(
        `Are you sure you want to remove "${productName}" from this location?`
      )
    ) {
      return;
    }

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
        setLocationDetails(updatedResult.location);
      }
    } catch (error) {
      setError('Failed to delete product from location');
    }
  };

  const handleClearSearch = () => {
    setLocationCode('');
    setLocationProducts([]);
    setLocationDetails(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className='max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md'>
      {/* Header with Image */}
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-2 bg-blue-100 rounded-lg'>
          <svg
            className='w-8 h-8 text-blue-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
            />
          </svg>
        </div>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>
            Location Management
          </h2>
          <p className='text-sm text-gray-600'>
            Manage warehouse locations and product assignments
          </p>
        </div>
      </div>

      {/* Search Location Section */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
            <h3 className='text-lg font-medium text-gray-900'>
              Manage Location Products
            </h3>
          </div>
          <button
            onClick={() => setSearchMode(!searchMode)}
            className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2'
          >
            {searchMode ? (
              <>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
                Hide Search
              </>
            ) : (
              <>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
                Show Search
              </>
            )}
          </button>
        </div>

        {searchMode && (
          <div className='p-6 border border-gray-200 rounded-lg bg-gray-50'>
            <form onSubmit={handleSearchLocation} className='mb-4'>
              <div className='flex gap-3'>
                <div className='flex-1'>
                  <label
                    htmlFor='searchLocationCode'
                    className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'
                  >
                    <svg
                      className='w-4 h-4 text-gray-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                    Location Code
                  </label>
                  <input
                    type='text'
                    id='searchLocationCode'
                    value={locationCode}
                    onChange={(e) => setLocationCode(e.target.value)}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Enter location code (e.g., A1-01)'
                  />
                </div>
                <div className='flex items-end gap-2'>
                  <button
                    type='submit'
                    disabled={isSearching || !locationCode.trim()}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2 ${
                      isSearching || !locationCode.trim()
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isSearching ? (
                      <>
                        <svg
                          className='animate-spin h-4 w-4 text-white'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          />
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          />
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                          />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                  {locationCode && (
                    <button
                      type='button'
                      onClick={handleClearSearch}
                      className='px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors flex items-center gap-2'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Location Details */}
            {locationDetails && (
              <div className='mb-4 p-3 bg-white rounded border flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded'>
                  <svg
                    className='w-5 h-5 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800'>
                    Location Found
                  </h4>
                  <p className='text-sm text-gray-600'>
                    <strong>Code:</strong> {locationDetails.code}
                    {locationDetails.description && (
                      <>
                        {' '}
                        - <strong>Description:</strong>{' '}
                        {locationDetails.description}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Products List */}
            {locationProducts.length > 0 ? (
              <div className='mt-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <svg
                    className='w-5 h-5 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                    />
                  </svg>
                  <h4 className='font-bold text-gray-800'>
                    Products at this location ({locationProducts.length})
                  </h4>
                </div>
                <div className='space-y-3'>
                  {locationProducts.map((item) => (
                    <div
                      key={item.id}
                      className='p-4 bg-white rounded-lg border border-gray-200 shadow-sm'
                    >
                      <div className='flex justify-between items-start'>
                        <div className='flex-1'>
                          <div className='flex items-start gap-3'>
                            {item.product.imageUrl ? (
                              <div className='flex-shrink-0'>
                                <Image
                                  width={60}
                                  height={60}
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className='w-15 h-15 object-cover rounded border'
                                />
                              </div>
                            ) : (
                              <div className='w-15 h-15 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0'>
                                <svg
                                  className='w-6 h-6 text-gray-400'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                  />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className='font-semibold text-gray-900'>
                                {item.product.name}
                              </p>
                              <div className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M13 10V3L4 14h7v7l9-11h-7z'
                                  />
                                </svg>
                                <span>EAN: {item.product.ean}</span>
                              </div>
                              <div className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                                  />
                                </svg>
                                <span>
                                  Quantity:{' '}
                                  <span className='font-medium'>
                                    {item.quantity}
                                  </span>
                                </span>
                              </div>
                              {item.product.description && (
                                <p className='text-sm text-gray-500 mt-2 flex items-start gap-1'>
                                  <svg
                                    className='w-4 h-4 mt-0.5 flex-shrink-0'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                  </svg>
                                  {item.product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleDeleteProduct(item.id, item.product.name)
                          }
                          disabled={isSearching}
                          className='ml-4 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1'
                          title={`Remove ${item.product.name} from location`}
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : locationCode && !isSearching && locationDetails ? (
              <div className='text-center py-8'>
                <div className='flex justify-center mb-3'>
                  <svg
                    className='w-16 h-16 text-gray-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                    />
                  </svg>
                </div>
                <p className='text-gray-500 text-lg'>
                  No products found at this location.
                </p>
                <p className='text-gray-400 text-sm mt-1'>
                  Scan products to add them to this location.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Add New Location Section */}
      <form
        id='location-form'
        onSubmit={handleSubmit}
        className='border-t pt-8'
      >
        <div className='flex items-center gap-2 mb-6'>
          <div className='p-2 bg-blue-100 rounded'>
            <svg
              className='w-5 h-5 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
          </div>
          <h3 className='text-xl font-semibold text-gray-800'>
            Add New Location
          </h3>
        </div>

        <div className='grid gap-6'>
          <div>
            <label
              htmlFor='code'
              className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'
            >
              <svg
                className='w-4 h-4 text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
                />
              </svg>
              Location Code *
            </label>
            <input
              type='text'
              id='code'
              name='code'
              required
              maxLength={50}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='e.g., A1-01, B2-15'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Unique identifier for the location
            </p>
          </div>

          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'
            >
              <svg
                className='w-4 h-4 text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                />
              </svg>
              Description
            </label>
            <textarea
              id='description'
              name='description'
              rows={3}
              maxLength={200}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              placeholder='Optional description of the location...'
            />
            <p className='text-xs text-gray-500 mt-1'>Max 200 characters</p>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className={`w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className='animate-spin h-4 w-4 text-white'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                Creating Location...
              </>
            ) : (
              <>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                Add New Location
              </>
            )}
          </button>
        </div>
      </form>

      {/* Status Messages */}
      {(error || success) && (
        <div
          className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
            error
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}
        >
          <div
            className={`p-1 rounded-full ${
              error ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            {error ? (
              <svg
                className='w-5 h-5 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            ) : (
              <svg
                className='w-5 h-5 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            )}
          </div>
          <div>
            <div className='font-medium'>{error ? 'Error' : 'Success'}</div>
            <p className='mt-1'>{error || success}</p>
          </div>
        </div>
      )}
    </div>
  );
}
