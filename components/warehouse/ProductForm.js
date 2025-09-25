'use client';

import { useActionState } from 'react';
import {
  createOrUpdateProduct,
  getProductsAndLocations,
  getProductImages,
} from '@/components/warehouse/actions';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // ... your existing useEffect hooks remain the same ...

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
    } else {
      setImagePreview('');
    }

    // Clear any selected file
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WEBP, GIF, or SVG)');
      return;
    }

    // Validate file size (max 10MB for Cloudinary)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Clear the URL input when file is selected
    document.getElementById('imageUrl').value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImagePreview(url);
    // Clear file selection when URL is entered
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulate upload progress for better UX
  useEffect(() => {
    if (isSubmitting && selectedFile) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isSubmitting, selectedFile]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    // Add the file to formData if selected
    if (selectedFile) {
      formData.append('imageFile', selectedFile);
    }

    // The server action will handle the upload and product creation/update
    const result = await createOrUpdateProduct(null, formData);

    if (result?.success) {
      setUploadProgress(100);
      // Wait a bit to show completion
      setTimeout(() => {
        resetForm();
        // Refresh the products list after successful submission
        refreshProducts();
      }, 1000);
    } else {
      setUploadProgress(0);
    }

    setIsSubmitting(false);
    return result;
  };

  const refreshProducts = async () => {
    try {
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
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setImagePreview('');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsEditing(false);

    // Reset form fields
    const form = document.getElementById('product-form');
    if (form) {
      form.reset();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNewProduct = () => {
    resetForm();
    setShowDropdown(false);
  };

  // ... rest of your existing functions (handleSearchChange, handleSearchFocus) remain the same ...

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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              setSelectedProduct(null);
              setIsEditing(false);
              resetForm();
            }
          }}
          onFocus={() => {
            if (filteredProducts.length > 0) {
              setShowDropdown(true);
            }
          }}
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
                  <div className='w-10 h-10 relative mr-3'>
                    {productImages[product.ean].includes('cloudinary') ? (
                      <CldImage
                        width={40}
                        height={40}
                        src={productImages[product.ean]}
                        alt={product.name}
                        className='w-10 h-10 object-contain rounded'
                      />
                    ) : (
                      <Image
                        width={40}
                        height={40}
                        src={productImages[product.ean]}
                        alt={product.name}
                        className='w-10 h-10 object-contain rounded'
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
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

      {/* Image Upload Section */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Product Image
        </label>

        {/* File Upload */}
        <div className='mb-3'>
          <label
            htmlFor='imageFile'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Upload from device (Recommended - uses Cloudinary)
          </label>
          <input
            ref={fileInputRef}
            type='file'
            id='imageFile'
            name='imageFile'
            accept='image/*'
            onChange={handleFileSelect}
            disabled={isSubmitting}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Supported formats: JPEG, PNG, WEBP, GIF, SVG (Max 10MB)
          </p>

          {/* Upload Progress */}
          {isSubmitting && selectedFile && (
            <div className='mt-2'>
              <div className='flex justify-between text-xs text-gray-600 mb-1'>
                <span>Uploading to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* OR separator */}
        <div className='flex items-center my-4'>
          <div className='flex-grow border-t border-gray-300'></div>
          <span className='mx-4 text-sm text-gray-500'>OR</span>
          <div className='flex-grow border-t border-gray-300'></div>
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor='imageUrl'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Image URL (Alternative)
          </label>
          <input
            type='url'
            id='imageUrl'
            name='imageUrl'
            onChange={handleImageUrlChange}
            placeholder='https://example.com/image.jpg'
            disabled={isSubmitting}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
          />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className='mt-4'>
            <div className='text-sm text-gray-600 mb-2'>Image Preview:</div>
            <div className='relative inline-block'>
              <div className='relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden'>
                {imagePreview.startsWith('data:') ||
                imagePreview.startsWith('http') ? (
                  <Image
                    width={128}
                    height={128}
                    src={imagePreview}
                    alt='Preview'
                    className='w-full h-full object-cover'
                    onError={() => setImagePreview('')}
                  />
                ) : (
                  <CldImage
                    width={128}
                    height={128}
                    src={imagePreview}
                    alt='Product preview'
                    className='w-full h-full object-cover'
                    sizes='128px'
                  />
                )}
              </div>
              <button
                type='button'
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none disabled:bg-gray-400'
              >
                ×
              </button>
            </div>
            {selectedFile && (
              <div className='mt-2 text-xs text-gray-500'>
                File: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
                {uploadProgress === 100 && (
                  <span className='ml-2 text-green-600'>
                    ✓ Uploaded to Cloudinary
                  </span>
                )}
              </div>
            )}
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
          disabled={isSubmitting}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50'
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
              {selectedFile
                ? 'Uploading...'
                : isEditing
                ? 'Updating...'
                : 'Creating...'}
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
            className='py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50'
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
