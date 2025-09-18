'use client';

import { useActionState } from 'react';
import {
  createProduct,
  getProductsAndLocations,
  getProductImages,
} from '@/components/warehouse/actions';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ProductForm() {
  const [state, formAction] = useActionState(createProduct, {});
  const [imagePreview, setImagePreview] = useState('');
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    if (document.getElementById('ean'))
      document.getElementById('ean').value = '';
    if (document.getElementById('name'))
      document.getElementById('name').value = '';
    if (document.getElementById('description'))
      document.getElementById('description').value = '';
    if (document.getElementById('imageUrl'))
      document.getElementById('imageUrl').value = '';
  };

  const handleNewProduct = () => {
    resetForm();
    setShowDropdown(false);
  };

  return (
    <form
      action={async (formData) => {
        try {
          const result = await createProduct({}, formData);
          if (result?.success) {
            resetForm();
          }
          return result;
        } catch (error) {
          return {
            success: false,
            error: error.message,
            message: 'Failed to submit form',
          };
        }
      }}
      className='max-w-md mx-auto p-4 bg-white rounded shadow'
    >
      <h2 className='text-xl font-bold mb-4'>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h2>

      <div className='mb-4 relative' ref={searchRef}>
        <label className='block text-sm font-medium text-gray-700'>
          Search Existing Product (optional)
        </label>
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          placeholder='Search by product name or EAN to edit'
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />

        {showDropdown && filteredProducts.length > 0 && (
          <div
            ref={dropdownRef}
            className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'
          >
            <div className='p-2 border-b border-gray-200 bg-gray-50'>
              <button
                type='button'
                onClick={handleNewProduct}
                className='w-full text-left text-sm text-indigo-600 hover:text-indigo-800 font-medium'
              >
                + Create New Product
              </button>
            </div>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className='flex items-center p-2 cursor-pointer hover:bg-gray-100'
              >
                {productImages[product.ean] ? (
                  <Image
                    width={40}
                    height={40}
                    src={productImages[product.ean]}
                    alt={product.name}
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
          htmlFor='ean'
          className='block text-sm font-medium text-gray-700'
        >
          EAN/Barcode *
        </label>
        <input
          type='text'
          id='ean'
          name='ean'
          required
          readOnly={isEditing}
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            isEditing ? 'bg-gray-100' : ''
          }`}
        />
      </div>

      <div className='mb-4'>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700'
        >
          Product Name *
        </label>
        <input
          type='text'
          id='name'
          name='name'
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />
      </div>

      <div className='mb-4'>
        <label
          htmlFor='imageUrl'
          className='block text-sm font-medium text-gray-700'
        >
          Image URL (optional)
        </label>
        <input
          type='url'
          id='imageUrl'
          name='imageUrl'
          onChange={handleImageUrlChange}
          placeholder='https://example.com/image.jpg'
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />
        {imagePreview && (
          <div className='mt-2'>
            <Image
              width={200}
              height={200}
              src={imagePreview}
              alt='Preview'
              className='h-20 w-20 object-cover rounded'
              onError={() => setImagePreview('')}
            />
          </div>
        )}
      </div>

      <div className='mb-4'>
        <label
          htmlFor='description'
          className='block text-sm font-medium text-gray-700'
        >
          Description (optional)
        </label>
        <textarea
          id='description'
          name='description'
          rows={3}
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />
      </div>

      <div className='flex gap-2'>
        <button
          type='submit'
          className='flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          {isEditing ? 'Update Product' : 'Add Product'}
        </button>

        {isEditing && (
          <button
            type='button'
            onClick={resetForm}
            className='bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
          >
            Cancel
          </button>
        )}
      </div>

      {state?.message && (
        <p
          className={`mt-2 ${
            state.success ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
