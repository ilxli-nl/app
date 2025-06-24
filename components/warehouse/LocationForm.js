'use client';

import { useActionState } from 'react';
import { createLocation } from '@/components/warehouse/actions';
import { useState } from 'react';

export default function LocationForm() {
  const [state, formAction] = useActionState(createLocation, null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await createLocation(null, formData);
      if (result?.success) {
        event.target.reset();
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Form submission failed',
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='max-w-md mx-auto p-4 bg-white rounded shadow'
    >
      <h2 className='text-xl font-bold mb-4'>Add New Location</h2>

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
          minLength={2}
          maxLength={10}
          pattern='[A-Za-z0-9]+'
          title='Alphanumeric characters only'
          className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
        />
        <p className='mt-1 text-sm text-gray-500'>e.g. A1, B2, WAREHOUSE-1</p>
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
          maxLength={200}
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

      {state?.success && (
        <div className='mt-4 p-3 bg-green-50 text-green-800 rounded'>
          <p>{state.message}</p>
          {state.location && (
            <p className='text-sm mt-1'>Code: {state.location.code}</p>
          )}
        </div>
      )}

      {state?.error && (
        <div className='mt-4 p-3 bg-red-50 text-red-800 rounded'>
          <p className='font-medium'>Error:</p>
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
