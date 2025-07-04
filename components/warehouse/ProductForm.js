'use client';

import { useActionState } from 'react';
import { createProduct } from '@/components/warehouse/actions';
import { useState } from 'react';
import Image from 'next/image';

export default function ProductForm() {
  const [state, formAction] = useActionState(createProduct, {});
  const [imagePreview, setImagePreview] = useState('');

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImagePreview(url);
  };

  return (
    <form
      action={async (formData) => {
        try {
          const result = await createProduct({}, formData);
          if (result?.success) {
            // Reset form on success
            e.target.reset();
            setImagePreview('');
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
      <h2 className='text-xl font-bold mb-4'>Add New Product</h2>

      <div className='mb-4'>
        <label
          htmlFor='ean'
          className='block text-sm font-medium text-gray-700'
        >
          EAN/Barcode
        </label>
        <input
          type='text'
          id='ean'
          name='ean'
          required
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />
      </div>

      <div className='mb-4'>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700'
        >
          Product Name
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

      <button
        type='submit'
        className='w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      >
        Add Product
      </button>

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
