'use client';

import { useActionState } from 'react';
import {
  assignProductToLocation,
  getProductsAndLocations,
  getProductImages,
} from '@/components/warehouse/actions';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function AssignProductForm() {
  const [state, formAction] = useActionState(assignProductToLocation, null);
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const productSearchRef = useRef(null);
  const productDropdownRef = useRef(null);
  const locationSearchRef = useRef(null);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getProductsAndLocations();
        if (result) {
          setProducts(result.products || []);
          setFilteredProducts(result.products || []);

          // Sort locations by code ascending
          const sortedLocations = (result.locations || []).sort((a, b) =>
            a.code.localeCompare(b.code, undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          );
          setLocations(sortedLocations);
          setFilteredLocations(sortedLocations);

          // Fetch images for all products
          const eans = result.products.map((p) => p.ean);
          const imagesResult = await getProductImages(eans);
          if (imagesResult) {
            setProductImages(imagesResult);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase()) ||
          product.ean.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, products]);

  // Filter locations based on search term
  useEffect(() => {
    if (locationSearchTerm.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(
        (location) =>
          location.code
            .toLowerCase()
            .includes(locationSearchTerm.toLowerCase()) ||
          (location.description &&
            location.description
              .toLowerCase()
              .includes(locationSearchTerm.toLowerCase()))
      );
      setFilteredLocations(filtered);
    }
  }, [locationSearchTerm, locations]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Product dropdown
      if (
        productSearchRef.current &&
        !productSearchRef.current.contains(event.target) &&
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false);
      }

      // Location dropdown
      if (
        locationSearchRef.current &&
        !locationSearchRef.current.contains(event.target) &&
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setShowLocationDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductSearchTerm(`${product.name} (EAN: ${product.ean})`);
    setShowProductDropdown(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setLocationSearchTerm(
      `${location.code} - ${location.description || 'No description'}`
    );
    setShowLocationDropdown(false);
  };

  const handleProductSearchChange = (e) => {
    setProductSearchTerm(e.target.value);
    setShowProductDropdown(true);
    if (!e.target.value) {
      setSelectedProduct(null);
    }
  };

  const handleLocationSearchChange = (e) => {
    const value = e.target.value;
    setLocationSearchTerm(value);

    if (scanMode) {
      // In scan mode, try to find location immediately
      const foundLocation = locations.find(
        (location) => location.code === value.trim()
      );

      if (foundLocation) {
        setSelectedLocation(foundLocation);
        setLocationSearchTerm(
          `${foundLocation.code} - ${
            foundLocation.description || 'No description'
          }`
        );
        setScanMode(false);

        // Auto-focus on quantity field after successful scan
        setTimeout(() => {
          const quantityInput = document.getElementById('quantity');
          if (quantityInput) quantityInput.focus();
        }, 100);
      } else {
        setSelectedLocation(null);
        setShowLocationDropdown(false);
      }
    } else {
      // In search mode, show dropdown
      setShowLocationDropdown(true);
      if (!value) {
        setSelectedLocation(null);
      }
    }
  };

  const handleProductSearchFocus = () => {
    if (filteredProducts.length > 0) {
      setShowProductDropdown(true);
    }
  };

  const handleLocationSearchFocus = () => {
    if (!scanMode && filteredLocations.length > 0) {
      setShowLocationDropdown(true);
    }
  };

  const handleScanModeToggle = () => {
    setScanMode(!scanMode);
    setLocationSearchTerm('');
    setSelectedLocation(null);
    setShowLocationDropdown(false);

    setTimeout(() => {
      const locationInput = document.getElementById('locationSearch');
      if (locationInput) {
        locationInput.focus();
        locationInput.select(); // Select all text for easy replacement
      }
    }, 100);
  };

  return (
    <form
      action={async (formData) => {
        if (selectedProduct) {
          formData.set('productId', selectedProduct.id);
        }
        if (selectedLocation) {
          formData.set('locationId', selectedLocation.id);
        }
        setIsSubmitting(true);
        const result = await formAction(formData);
        setIsSubmitting(false);
        return result;
      }}
      className='max-w-full mx-auto p-4 bg-white rounded shadow'
    >
      {/* Product Search Section */}
      <div className='mb-4 relative' ref={productSearchRef}>
        <label
          htmlFor='productSearch'
          className='block text-sm font-medium text-gray-700'
        >
          Product*
        </label>
        <input
          type='text'
          id='productSearch'
          name='productSearch'
          value={productSearchTerm}
          onChange={handleProductSearchChange}
          onFocus={handleProductSearchFocus}
          placeholder='Search by product name or EAN'
          required
          disabled={isSubmitting}
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50'
        />
        <input
          type='hidden'
          name='productId'
          value={selectedProduct?.id || ''}
        />

        {showProductDropdown && filteredProducts.length > 0 && (
          <div
            ref={productDropdownRef}
            className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className='flex items-center p-2 cursor-pointer hover:bg-gray-100'
              >
                {productImages[product.ean] ? (
                  <Image
                    src={productImages[product.ean]}
                    alt={product.name}
                    width={40}
                    height={40}
                    className='w-10 h-10 object-contain mr-3'
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      const fallback = document.createElement('div');
                      fallback.className =
                        'w-10 h-10 bg-gray-200 flex items-center justify-center mr-3';
                      fallback.innerHTML =
                        '<span class="text-xs text-gray-500">No image</span>';
                      parent.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className='w-10 h-10 bg-gray-200 flex items-center justify-center mr-3'>
                    <span className='text-xs text-gray-500'>No image</span>
                  </div>
                )}
                <div>
                  <div className='font-medium'>{product.name}</div>
                  <div className='text-sm text-gray-500'>
                    EAN: {product.ean}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Search/Scan Section */}
      <div className='mb-4'>
        <div className='flex items-center justify-between mb-2'>
          <label
            htmlFor='locationSearch'
            className='block text-sm font-medium text-gray-700'
          >
            Location*
          </label>
          <button
            type='button'
            onClick={handleScanModeToggle}
            className={`text-xs px-2 py-1 rounded ${
              scanMode
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            } hover:opacity-80 transition-opacity`}
          >
            {scanMode ? '📷 Scan Mode' : '🔍 Search Mode'}
          </button>
        </div>

        <div className='relative' ref={locationSearchRef}>
          <input
            type='text'
            id='locationSearch'
            name='locationSearch'
            value={locationSearchTerm}
            onChange={handleLocationSearchChange}
            onFocus={handleLocationSearchFocus}
            placeholder={
              scanMode
                ? 'Scan location barcode...'
                : 'Search by location code or description'
            }
            required
            disabled={isSubmitting} // Only disable when submitting, not for scan mode
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 ${
              scanMode
                ? 'border-2 border-green-400 bg-green-50'
                : 'border-gray-300'
            }`}
          />
          <input
            type='hidden'
            name='locationId'
            value={selectedLocation?.id || ''}
          />

          {!scanMode &&
            showLocationDropdown &&
            filteredLocations.length > 0 && (
              <div
                ref={locationDropdownRef}
                className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'
              >
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className='p-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0'
                  >
                    <div className='font-medium'>{location.code}</div>
                    <div className='text-sm text-gray-500'>
                      {location.description || 'No description'}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {scanMode && (
          <p className='mt-1 text-xs text-green-600'>
            💡 Scan mode active - enter location code to auto-detect
          </p>
        )}
      </div>

      {/* Quantity Section */}
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

      {/* Selected Items Summary */}
      {(selectedProduct || selectedLocation) && (
        <div className='mb-4 p-3 bg-blue-50 rounded-md border border-blue-200'>
          <h3 className='font-medium text-blue-800 mb-2'>Selected Items:</h3>
          <div className='space-y-2'>
            {selectedProduct && (
              <div className='flex items-center space-x-3'>
                {productImages[selectedProduct.ean] ? (
                  <Image
                    src={productImages[selectedProduct.ean]}
                    alt={selectedProduct.name}
                    width={40}
                    height={40}
                    className='w-10 h-10 object-contain rounded border'
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className='w-10 h-10 bg-gray-200 flex items-center justify-center rounded border'>
                    <span className='text-xs text-gray-500'>No image</span>
                  </div>
                )}
                <div>
                  <p className='text-sm font-medium text-blue-700'>
                    {selectedProduct.name}
                  </p>
                  <p className='text-xs text-blue-600'>
                    EAN: {selectedProduct.ean}
                  </p>
                </div>
              </div>
            )}
            {selectedLocation && (
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-blue-100 flex items-center justify-center rounded border border-blue-200'>
                  <span className='text-lg'>📍</span>
                </div>
                <div>
                  <p className='text-sm font-medium text-blue-700'>
                    {selectedLocation.code}
                  </p>
                  <p className='text-xs text-blue-600'>
                    {selectedLocation.description || 'No description'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type='submit'
        disabled={isSubmitting || !selectedProduct || !selectedLocation}
        className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors ${
          isSubmitting || !selectedProduct || !selectedLocation
            ? 'opacity-50 cursor-not-allowed'
            : ''
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
          <p className='font-medium'>{state.success ? 'Success!' : 'Error!'}</p>
          <p>{state.message}</p>
          {state.error && (
            <details className='mt-2 text-xs'>
              <summary className='cursor-pointer'>Technical details</summary>
              <pre className='mt-1 p-2 bg-gray-100 rounded overflow-x-auto'>
                {state.error}
              </pre>
            </details>
          )}
        </div>
      )}
    </form>
  );
}
