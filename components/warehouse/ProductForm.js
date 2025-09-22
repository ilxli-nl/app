'use client';

import { useActionState } from 'react';
import {
  createOrUpdateProduct,
  getProductsAndLocations,
  getProductImages,
} from '@/components/warehouse/actions';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ProductForm() {
  const [state, formAction] = useActionState(createOrUpdateProduct, null);
  const [imagePreview, setImagePreview] = useState('');
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getProductsAndLocations();
        if (result) {
          setProducts(result.products || []);
          setFilteredProducts(result.products || []);

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
    setIsEditing(true);

    // Pre-fill the form with existing product data
    document.getElementById('ean').value = product.ean;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description || '';

    // Set image preview if available
    if (productImages[product.ean]) {
      setImagePreview(productImages[product.ean]);
      document.getElementById('imageUrl').value = productImages[product.ean];
    } else {
      setImagePreview('');
      document.getElementById('imageUrl').value = '';
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedProduct(null);
      setIsEditing(false);
      resetForm();
    }
  };

  const handleSearchFocus = () => {
    if (filteredProducts.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImagePreview(url);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setImagePreview('');
    setIsEditing(false);

    // Reset form fields
    const form = document.getElementById('product-form');
    if (form) {
      form.reset();
    }
  };

  const handleNewProduct = () => {
    resetForm();
    setShowDropdown(false);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // Pass null as prevState and the actual formData
      const result = await createOrUpdateProduct(null, formData);

      if (result?.success) {
        resetForm();
        // Refresh the products list after successful submission
        const updatedResult = await getProductsAndLocations();
        if (updatedResult) {
          setProducts(updatedResult.products || []);
          setFilteredProducts(updatedResult.products || []);

          // Refresh images
          const eans = updatedResult.products.map((p) => p.ean);
          const imagesResult = await getProductImages(eans);
          if (imagesResult) {
            setProductImages(imagesResult);
          }
        }
      }
      return result;
    } catch (error) {
      // Handle any unexpected errors in the submission process
      const errorMessage = error?.message || 'Failed to submit form';
      console.log('Form submission error:', errorMessage);

      return {
        success: false,
        message: 'Failed to submit form',
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id='product-form'
      action={handleFormSubmit}
      className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'
    >
      <h2 className='text-2xl font-bold mb-6 text-gray-800'>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h2>

      {/* Search Existing Product */}
      <div className='mb-6 relative' ref={searchRef}>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Search Existing Product (optional)
        </label>
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          placeholder='Search by product name or EAN to edit'
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />

        {showDropdown && filteredProducts.length > 0 && (
          <div
            ref={dropdownRef}
            className='absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'
          >
            <div className='p-3 border-b border-gray-200 bg-gray-50'>
              <button
                type='button'
                onClick={handleNewProduct}
                className='w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium'
              >
                + Create New Product
              </button>
            </div>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className='flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors'
              >
                {productImages[product.ean] ? (
                  <Image
                    width={40}
                    height={40}
                    src={productImages[product.ean]}
                    alt={product.name}
                    className='w-10 h-10 object-contain mr-3 rounded'
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className='w-10 h-10 bg-gray-100 flex items-center justify-center mr-3 rounded'>
                    <span className='text-xs text-gray-500'>No image</span>
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-gray-900 truncate'>
                    {product.name}
                  </div>
                  <div className='text-sm text-gray-500 truncate'>
                    EAN: {product.ean}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EAN Field */}
      <div className='mb-4'>
        <label
          htmlFor='ean'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          EAN/Barcode *
        </label>
        <input
          type='text'
          id='ean'
          name='ean'
          required
          readOnly={isEditing}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>

      {/* Product Name */}
      <div className='mb-4'>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Product Name *
        </label>
        <input
          type='text'
          id='name'
          name='name'
          required
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </div>

      {/* Image URL */}
      <div className='mb-4'>
        <label
          htmlFor='imageUrl'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Image URL (optional)
        </label>
        <input
          type='url'
          id='imageUrl'
          name='imageUrl'
          onChange={handleImageUrlChange}
          placeholder='https://example.com/image.jpg'
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
        {imagePreview && (
          <div className='mt-3'>
            <div className='text-sm text-gray-600 mb-1'>Image Preview:</div>
            <div className='relative w-20 h-20 border border-gray-300 rounded-lg overflow-hidden'>
              <Image
                width={80}
                height={80}
                src={imagePreview}
                alt='Preview'
                className='w-full h-full object-cover'
                onError={() => setImagePreview('')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className='mb-6'>
        <label
          htmlFor='description'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Description (optional)
        </label>
        <textarea
          id='description'
          name='description'
          rows={3}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
          placeholder='Enter product description...'
        />
      </div>

      {/* Buttons */}
      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={isSubmitting}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          {isSubmitting ? (
            <span className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
              {isEditing ? 'Updating...' : 'Creating...'}
            </span>
          ) : isEditing ? (
            'Update Product'
          ) : (
            'Add Product'
          )}
        </button>

        {isEditing && (
          <button
            type='button'
            onClick={resetForm}
            disabled={isSubmitting}
            className='py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors'
          >
            Cancel
          </button>
        )}
      </div>

      {/* Status Messages */}
      {state?.message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            state.success
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          <div className='font-medium'>
            {state.success ? 'Success!' : 'Error!'}
          </div>
          <p className='text-sm mt-1'>{state.message}</p>
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
