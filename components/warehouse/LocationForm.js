'use client';
import { useFormState } from 'react-dom';
import { createLocation } from './actions';

export default function LocationForm() {
  const [state, formAction] = useFormState(createLocation, null);

  return (
    <div className='card bg-base-200'>
      <div className='card-body'>
        <h2 className='card-title'>Create New Location</h2>

        {state?.success && (
          <div className='alert alert-success'>{state.message}</div>
        )}

        {state?.error && (
          <div className='alert alert-error'>{state.message}</div>
        )}

        <form action={formAction}>
          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Location Code*</span>
            </label>
            <input
              type='text'
              name='code'
              className='input input-bordered'
              required
              placeholder='e.g., A-01-02'
            />
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text'>Description (optional)</span>
            </label>
            <input
              type='text'
              name='description'
              className='input input-bordered'
              placeholder='e.g., Aisle 1, Shelf 2'
            />
          </div>

          <div className='form-control mt-6'>
            <button type='submit' className='btn btn-primary'>
              Create Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
