'use client';

import { useActionState, useEffect } from 'react';
import {
  scanProduct,
  updateProductQuantity,
  moveProductLocation,
} from '@/components/warehouse/actions';
import { useState } from 'react';
import Image from 'next/image';

export default function ProductScanner() {
  const [state, formAction] = useActionState(scanProduct, null);
  const [scanMode, setScanMode] = useState(false);
  const [locations, setLocations] = useState([]);
  return (
    <div className='max-w-md mx-auto p-4 bg-white rounded shadow'>
      <h2 className='text-xl font-bold mb-4'>Product Scanner</h2>

      <button
        onClick={() => setScanMode(!scanMode)}
        className='mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      >
        {scanMode ? 'Exit Scan Mode' : 'Enter Scan Mode'}
      </button>

      {scanMode ? (
        <div className='mb-4 p-4 border-2 border-dashed border-indigo-300 rounded-lg'>
          <p className='text-center mb-2'>Scan a product barcode now</p>
          <form action={formAction}>
            <input
              type='text'
              id='productEan'
              name='productEan'
              autoFocus
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='Or enter EAN manually'
            />
          </form>
        </div>
      ) : (
        <form action={formAction} className='mb-4'>
          <div>
            <label
              htmlFor='productEan'
              className='block text-sm font-medium text-gray-700'
            >
              Product EAN
            </label>
            <input
              type='text'
              id='productEan'
              name='productEan'
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='Enter product EAN/barcode'
            />
          </div>
          <button
            type='submit'
            className='mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            Search Product
          </button>
        </form>
      )}

      {state?.product && (
        <div className='mt-4 p-4 bg-gray-50 rounded'>
          <div className='flex items-start space-x-4'>
            {state.product.imageUrl && (
              <Image
                width={200}
                height={200}
                src={state.product.imageUrl}
                alt={state.product.name}
                className='h-24 w-24 object-cover rounded'
              />
            )}
            <div>
              <h3 className='font-bold'>{state.product.name}</h3>
              <p>EAN: {state.product.ean}</p>
              <p className='mt-1 text-sm'>
                {state.product.description || 'No description available'}
              </p>
            </div>
          </div>

          {state.locations.length > 0 ? (
            <div className='mt-4'>
              <h4 className='font-bold'>
                Locations where this product is stored:
              </h4>
              <ul className='mt-2 space-y-2'>
                {state.locations.map((item) => (
                  <li key={item.id} className='p-2 bg-white rounded shadow'>
                    <div className='flex justify-between items-center'>
                      <div>
                        <p className='font-medium'>{item.location.code}</p>
                        <p>{item.location.description || 'No description'}</p>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <ProductLocationActions
                        assignmentId={item.id}
                        currentQuantity={item.quantity}
                        currentLocationId={item.locationId}
                        availableLocations={state.locations.filter(
                          (l) => l.id !== item.locationId
                        )}
                      />
                    </div>

                    {item.history.length > 0 && (
                      <div className='mt-2 pt-2 border-t border-gray-200'>
                        <h5 className='text-sm font-medium text-gray-500'>
                          Modification History:
                        </h5>
                        <ul className='text-xs space-y-1 mt-1'>
                          {item.history.map((history) => (
                            <li
                              key={history.id}
                              className='flex justify-between'
                            >
                              <span>
                                {new Date(history.createdAt).toLocaleString()} -
                                {history.user.username}{' '}
                                {history.action.toLowerCase()}d
                                {history.field ? ` ${history.field}` : ''}
                              </span>
                              {history.field && (
                                <span>
                                  {history.oldValue} → {history.newValue}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className='mt-4 text-gray-500'>
              This product is not assigned to any location.
            </p>
          )}
        </div>
      )}

      {state?.error && !state?.product && (
        <p className='mt-2 text-red-600'>{state.error}</p>
      )}
    </div>
  );
}

function ProductLocationActions({
  assignmentId,
  currentQuantity: initialQuantity, // Rename prop for clarity
  currentLocationId,
  availableLocations,
}) {
  console.log('Received availableLocations:', availableLocations); // Debug log
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);

  const handleUpdateSuccess = (newQuantity) => {
    setQuantity(newQuantity); // Update the local state
    setShowEditForm(false); // Close the form
  };

  if (showEditForm) {
    return (
      <EditQuantityForm
        assignmentId={assignmentId}
        currentQuantity={quantity}
        onSuccess={handleUpdateSuccess}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  if (showMoveForm) {
    return (
      <MoveLocationForm
        assignmentId={assignmentId}
        availableLocations={availableLocations}
        onCancel={() => setShowMoveForm(false)}
      />
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <span className='font-medium'>{quantity}</span>
      <button
        onClick={() => setShowEditForm(true)}
        className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200'
      >
        Edit
      </button>
      <button
        onClick={() => setShowMoveForm(true)}
        className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200'
      >
        Move
      </button>
    </div>
  );
}

function EditQuantityForm({
  assignmentId,
  currentQuantity,
  onSuccess,
  onCancel,
}) {
  const [state, formAction] = useActionState(updateProductQuantity, null);
  const [quantity, setQuantity] = useState(currentQuantity);

  useEffect(() => {
    if (state?.success) {
      onSuccess(state.newQuantity); // Update parent with new quantity
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className='flex items-center gap-2'>
      <input type='hidden' name='assignmentId' value={assignmentId} />
      <input
        type='number'
        name='newQuantity'
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min='1'
        className='w-16 px-2 py-1 border border-gray-300 rounded text-sm'
      />
      <button
        type='submit'
        className='px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700'
      >
        Save
      </button>
      <button
        type='button'
        onClick={onCancel}
        className='px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300'
      >
        Cancel
      </button>
      {state?.error && <p className='text-red-500 text-xs'>{state.error}</p>}
    </form>
  );
}
function MoveLocationForm({
  assignmentId,
  availableLocations,
  onCancel,
  onSuccess,
}) {
  const [state, formAction] = useActionState(moveProductLocation, null);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form
      action={formAction}
      className='flex flex-col gap-2 p-2 border rounded'
    >
      <input type='hidden' name='assignmentId' value={assignmentId} />

      <div className='flex items-center gap-2'>
        <select
          name='newLocationId'
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className='flex-1 px-3 py-2 border rounded'
          required
        >
          <option value=''>Select new location</option>
          {availableLocations.map((location) => (
            <option key={location.location.id} value={location.location.id}>
              {location.location.code} -
              {location.location.description || 'No description'}
            </option>
          ))}
        </select>
      </div>

      <div className='flex gap-2 justify-end'>
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1 bg-gray-200 rounded'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-3 py-1 bg-green-600 text-white rounded'
          disabled={!selectedLocation}
        >
          Confirm Move
        </button>
      </div>

      {state?.error && (
        <p className='text-red-500 text-sm mt-1'>{state.error}</p>
      )}
    </form>
  );
}
