'use client';

import { useActionState } from 'react';
import {
  assignProductToLocation,
  getProductsAndLocations,
  getProductImages, // We'll add this to your actions
} from '@/components/warehouse/actions';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function AssignProductForm() {
  const [state, formAction] = useActionState(assignProductToLocation, null);
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({}); // Store images by EAN
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getProductsAndLocations();
        if (result) {
          setProducts(result.products || []);
          setFilteredProducts(result.products || []);
          setLocations(result.locations || []);

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

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.ean.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(`${product.name} (EAN: ${product.ean})`);
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedProduct(null);
    }
  };

  const handleSearchFocus = () => {
    if (filteredProducts.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <form
      action={async (formData) => {
        if (selectedProduct) {
          formData.set('productId', selectedProduct.id);
        }
        setIsSubmitting(true);
        const result = await formAction(formData);
        setIsSubmitting(false);
        return result;
      }}
      className='max-w-md mx-auto p-4 bg-white rounded shadow'
    >
      <h2 className='text-xl font-bold mb-4'>Assign Product to Location</h2>

      <div className='mb-4 relative' ref={searchRef}>
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
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
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

        {showDropdown && filteredProducts.length > 0 && (
          <div
            ref={dropdownRef}
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
        disabled={isSubmitting || !selectedProduct}
        className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isSubmitting || !selectedProduct
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
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
