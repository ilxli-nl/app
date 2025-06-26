'use client';
import { useState } from 'react';
import { createProduct } from './actions';
import { useFormState } from 'react-dom';

export default function ProductForm() {
  const [state, formAction] = useFormState(createProduct, null);
  const [ean, setEan] = useState('');

  const handleEanChange = (e) => {
    const value = e.target.value;
    // Basic EAN validation (13 digits)
    if (/^\d*$/.test(value)) {
      setEan(value.slice(0, 13));
    }
  };

  return (
    <div className='card bg-base-200'>
      <div className='card-body'>
        <h2 className='card-title'>Register New Product</h2>

        {state?.success && (
          <div className='alert alert-success'>{state.message}</div>
        )}

        {state?.error && (
          <div className='alert alert-error'>{state.message}</div>
        )}

        <form action={formAction}>
          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>EAN (13 digits)</span>
            </label>
            <input
              type='text'
              name='ean'
              value={ean}
              onChange={handleEanChange}
              className='input input-bordered'
              required
              pattern='\d{13}'
              title='Please enter exactly 13 digits'
            />
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Product Name</span>
            </label>
            <input
              type='text'
              name='name'
              className='input input-bordered'
              required
            />
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Description</span>
            </label>
            <textarea
              name='description'
              className='textarea textarea-bordered'
            />
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Image URL (optional)</span>
            </label>
            <input
              type='url'
              name='imageUrl'
              className='input input-bordered'
            />
          </div>

          <div className='form-control mt-6'>
            <button type='submit' className='btn btn-primary'>
              Register Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
