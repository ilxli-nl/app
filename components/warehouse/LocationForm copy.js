'use client';

import { useActionState } from 'react';
import { createLocation } from '@/components/warehouse/actions';
import { useEffect, useState } from 'react';

export default function LocationForm() {
  const [state, formAction] = useActionState(createLocation, {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  return (
    <form
      onSubmit={handleSubmit}
      className='max-w-lg mx-auto p-4 bg-white rounded shadow'
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
    </form>
  );
}
