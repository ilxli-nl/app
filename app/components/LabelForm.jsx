'use client';

import { useActionState, useFormStatus } from 'react-dom';
import { createBpostLabel } from '../actions/bpost';

export default function LabelForm() {
  const [state, formAction] = useActionState(createBpostLabel, null);

  return (
    <form action={formAction} className="space-y-4 max-w-md mx-auto">
      {/* Form fields remain exactly the same as before */}
      <div>
        <label htmlFor="name" className="block mb-1">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue="BBBBBBBBBBBBBBBB"
          className="w-full p-2 border rounded"
          required
        />
      </div>

      {/* ... other form fields ... */}

      <SubmitButton />
      
      {state?.error && (
        <p className="text-red-500 mt-2">{state.error}</p>
      )}
      {state?.data && (
        <p className="text-green-500 mt-2">Label created successfully!</p>
      )}
    </form>
  );
}

// SubmitButton remains the same
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full p-2 bg-blue-500 text-white rounded ${
        pending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
      }`}
    >
      {pending ? 'Creating Label...' : 'Create Label'}
    </button>
  );
}