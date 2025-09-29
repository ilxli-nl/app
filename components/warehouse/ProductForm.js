'use client';

import {
  createOrUpdateProduct,
  getProductsAndLocations,
  getProductImages,
} from '@/components/warehouse/actions';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ProductForm() {
  const [state, setState] = useState(null);
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
  const [cloudinaryError, setCloudinaryError] = useState('');
  const [compressionQuality, setCompressionQuality] = useState(0.1);
  const [maxWidth, setMaxWidth] = useState(400);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch products and images on component mount
  useEffect(() => {
    async function loadData() {
      try {
        const result = await getProductsAndLocations();
        if (result && result.products) {
          setProducts(result.products);
          setFilteredProducts(result.products);

          // Fetch images for all products
          const eans = result.products.map((p) => p.ean);
          if (eans.length > 0) {
            const imagesResult = await getProductImages(eans);
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

  // Close dropdown when clicking outside
  useEffect(() => {
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

  // Clear Cloudinary error when form is reset or editing changes
  useEffect(() => {
    if (cloudinaryError) {
      setCloudinaryError('');
    }
  }, [isEditing, searchTerm, cloudinaryError]);

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

  /**
   * Resize image before uploading
   */
  const resizeImage = (file, maxWidth, quality) => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale while preserving aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // White background (for PNG → JPG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const outputFormat = 'image/jpeg';
        const outputQuality = Math.max(0.1, Math.min(1.0, quality));

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to resize image'));
              return;
            }

            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const resizedFile = new File([blob], fileName, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            // Debugging
            console.log('📊 Compression Results:');
            console.log(
              `Original: ${(file.size / 1024 / 1024).toFixed(2)} MB (${
                file.type
              })`
            );
            console.log(
              `Compressed: ${(resizedFile.size / 1024 / 1024).toFixed(2)} MB (${
                resizedFile.type
              })`
            );

            resolve(resizedFile);

            // cleanup
            URL.revokeObjectURL(objectUrl);
          },
          outputFormat,
          outputQuality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(`${product.name} (EAN: ${product.ean})`);
    setShowDropdown(false);
    setIsEditing(true);

    // Pre-fill the form with existing product data
    setTimeout(() => {
      const eanField = document.getElementById('ean');
      const nameField = document.getElementById('name');
      const descriptionField = document.getElementById('description');
      const imageUrlField = document.getElementById('imageUrl');

      if (eanField) eanField.value = product.ean;
      if (nameField) nameField.value = product.name;
      if (descriptionField) descriptionField.value = product.description || '';

      // Set image preview if available
      if (productImages[product.ean]) {
        setImagePreview(productImages[product.ean]);
        if (imageUrlField) imageUrlField.value = productImages[product.ean];
      } else {
        setImagePreview('');
        if (imageUrlField) imageUrlField.value = '';
      }
    }, 0);

    // Clear any selected file
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleFileSelect = async (event) => {
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

    setUploadProgress(0);
    setCloudinaryError('');

    try {
      let processedFile = file;

      // Skip resizing for SVG (vector) and GIF (animated) files
      if (file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
        console.log('🔄 Starting image compression...');
        processedFile = await resizeImage(file, maxWidth, compressionQuality);
      } else {
        console.log('⏩ Skipping compression for SVG/GIF file');
      }

      setSelectedFile(processedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(processedFile);

      // Clear the URL input when file is selected
      const imageUrlField = document.getElementById('imageUrl');
      if (imageUrlField) imageUrlField.value = '';
    } catch (error) {
      console.error('❌ Error processing image:', error);
      alert('Failed to process image. Please try another file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setCloudinaryError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImagePreview(url);
    setCloudinaryError('');
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // NEW: Proper form submission handler
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);
    setCloudinaryError('');
    setState(null);

    try {
      // Get form values
      const form = event.currentTarget;
      const ean = form.ean.value;
      const name = form.name.value;
      const description = form.description.value;
      const imageUrl = form.imageUrl.value;

      console.log('📝 Form values:', { ean, name, description, imageUrl });

      // Create FormData manually
      const formData = new FormData();
      formData.append('ean', ean);
      formData.append('name', name);
      formData.append('description', description || '');

      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      // Add the compressed file if it exists
      if (selectedFile) {
        console.log('📤 Adding compressed file to FormData:');
        console.log('File details:', {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
        });

        formData.append('imageFile', selectedFile);

        // Verify the file was appended
        console.log('🔍 FormData contents:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(
              `- ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
            );
          } else {
            console.log(`- ${key}: ${value}`);
          }
        }
      } else {
        console.log('📤 No file to upload');
      }

      // Add compression settings
      formData.append(
        'compressionSettings',
        JSON.stringify({
          maxWidth,
          quality: compressionQuality,
          timestamp: new Date().toISOString(),
        })
      );

      console.log('🚀 Calling Server Action...');

      // Call Server Action directly
      const result = await createOrUpdateProduct(null, formData);

      // Update state with result
      setState(result);

      if (result?.success) {
        console.log('✅ Product created/updated successfully');
        setUploadProgress(100);
        setTimeout(() => {
          resetForm();
          refreshProducts();
        }, 1000);
      } else {
        console.error('❌ Operation failed:', result);
        if (result?.message) {
          setCloudinaryError(result.message);
        }
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setUploadProgress(0);
      setCloudinaryError('An unexpected error occurred');
      setState({
        success: false,
        message: 'Failed to submit form',
        error: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const updatedResult = await getProductsAndLocations();
      if (updatedResult) {
        setProducts(updatedResult.products || []);
        setFilteredProducts(updatedResult.products || []);

        // Refresh images
        const eans = updatedResult.products.map((p) => p.ean);
        if (eans.length > 0) {
          const imagesResult = await getProductImages(eans);
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
    setCloudinaryError('');
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

  // Update the form to use onSubmit instead of action
  return (
    <form
      id='product-form'
      onSubmit={handleFormSubmit} // CHANGED from action to onSubmit
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
                  <div className='w-10 h-10 relative mr-3'>
                    <Image
                      width={40}
                      height={40}
                      src={productImages[product.ean]}
                      alt={product.name}
                      className='w-10 h-10 object-contain rounded'
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        const fallback = document.createElement('div');
                        fallback.className =
                          'w-10 h-10 bg-gray-100 flex items-center justify-center rounded';
                        fallback.innerHTML =
                          '<span class="text-xs text-gray-500">No image</span>';
                        parent.appendChild(fallback);
                      }}
                    />
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

        {/* Compression Settings */}
        <div className='mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            Image Compression Settings
          </label>

          {/* Max Width Setting */}
          <div className='mb-3'>
            <label className='block text-xs text-gray-600 mb-1'>
              Maximum Width: {maxWidth}px
            </label>
            <input
              type='range'
              min='400'
              max='2000'
              step='100'
              value={maxWidth}
              onChange={(e) => setMaxWidth(parseInt(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>400px</span>
              <span>1200px</span>
              <span>2000px</span>
            </div>
          </div>

          {/* Quality Setting */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Quality: {Math.round(compressionQuality * 100)}%
            </label>
            <input
              type='range'
              min='10'
              max='100'
              step='5'
              value={compressionQuality * 100}
              onChange={(e) =>
                setCompressionQuality(parseInt(e.target.value) / 100)
              }
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>Smaller File</span>
              <span>Balanced</span>
              <span>Better Quality</span>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className='mb-3'>
          <label
            htmlFor='imageFile'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Upload from device (Recommended - automatic compression)
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
            Supported formats: JPEG, PNG, WEBP, GIF, SVG (Max 10MB).
            JPEG/PNG/WEBP images will be automatically compressed.
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
            Image URL (Alternative - no compression)
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

        {/* Cloudinary Error Message */}
        {cloudinaryError && (
          <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded'>
            <p className='text-red-600 text-sm'>{cloudinaryError}</p>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className='mt-4'>
            <div className='text-sm text-gray-600 mb-2'>Image Preview:</div>
            <div className='relative inline-block'>
              <div className='relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden'>
                <img
                  src={imagePreview}
                  alt='Preview'
                  className='w-full h-full object-cover'
                  onError={() => setImagePreview('')}
                />
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
