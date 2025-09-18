'use client';

import { useActionState, useEffect } from 'react';
import {
  scanLocation,
  updateProductQuantity,
  moveProductLocation,
  getLocations,
} from '@/components/warehouse/actions';
import { useState } from 'react';
import Image from 'next/image';

export default function LocationScanner() {
  const [state, formAction] = useActionState(scanLocation, null);
  const [scanMode, setScanMode] = useState(false);
  const [allLocations, setAllLocations] = useState([]);

  // Fetch all locations on component mount
  useEffect(() => {
    async function fetchLocations() {
      const locations = await getLocations();
      setAllLocations(locations);
    }
    fetchLocations();
  }, []);

  return (
    <div className='max-w-lg mx-auto p-4 bg-white rounded shadow'>
      <h2 className='text-xl font-bold mb-4'>Location Scanner</h2>

      <button
        onClick={() => setScanMode(!scanMode)}
        className='mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      >
        {scanMode ? 'Exit Scan Mode' : 'Enter Scan Mode'}
      </button>

      {scanMode ? (
        <div className='mb-4 p-4 border-2 border-dashed border-indigo-300 rounded-lg'>
          <p className='text-center mb-2'>Scan a location barcode now</p>
          <form action={formAction}>
            <input
              type='text'
              id='locationCode'
              name='locationCode'
              autoFocus
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='Or enter location code manually'
            />
          </form>
        </div>
      ) : (
        <form action={formAction} className='mb-4'>
          <div>
            <label
              htmlFor='locationCode'
              className='block text-sm font-medium text-gray-700'
            >
              Location Code
            </label>
            <input
              type='text'
              id='locationCode'
              name='locationCode'
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='Enter location code (e.g., A1, B2)'
            />
          </div>
          <button
            type='submit'
            className='mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            Search Location
          </button>
        </form>
      )}

      {state?.location && (
        <div className='mt-4 p-4 bg-gray-50 rounded'>
          <h3 className='font-bold'>Location: {state.location.code}</h3>
          <p>{state.location.description || 'No description available'}</p>

          {state.products.length > 0 ? (
            <div className='mt-4'>
              <h4 className='font-bold'>Products at this location:</h4>
              <ul className='mt-2 space-y-2'>
                {state.products.map((item) => (
                  <li key={item.id} className='p-2 bg-white rounded shadow'>
                    <div className='flex items-start space-x-3'>
                      {/* Product Image */}
                      {state.productImages &&
                      state.productImages[item.product.ean] ? (
                        <Image
                          width={48}
                          height={48}
                          src={state.productImages[item.product.ean]}
                          alt={item.product.name}
                          className='w-12 h-12 object-contain flex-shrink-0'
                        />
                      ) : (
                        <div className='w-12 h-12 bg-gray-200 flex items-center justify-center flex-shrink-0'>
                          <span className='text-xs text-gray-500'>
                            No image
                          </span>
                        </div>
                      )}

                      {/* Product Details */}
                      <div className='flex-grow'>
                        <p className='font-medium'>{item.product.name}</p>
                        <p className='text-sm text-gray-600'>
                          EAN: {item.product.ean}
                        </p>
                        <div className='flex justify-between items-center mt-1'>
                          <p className='text-sm text-gray-600'>
                            Quantity: {item.quantity}
                          </p>
                          <ProductLocationActions
                            assignmentId={item.id}
                            currentQuantity={item.quantity}
                            currentLocationId={item.locationId}
                            allLocations={allLocations}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className='mt-4 text-gray-500'>
              No products assigned to this location.
            </p>
          )}
        </div>
      )}

      {state?.error && !state?.location && (
        <p className='mt-2 text-red-600'>{state.error}</p>
      )}
    </div>
  );
}

function ProductLocationActions({
  assignmentId,
  currentQuantity: initialQuantity,
  currentLocationId,
  allLocations,
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);

  // Update local quantity when prop changes
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  // Filter out the current location
  const availableLocations = allLocations.filter(
    (location) => location.id !== currentLocationId
  );

  const handleUpdateSuccess = (newQuantity) => {
    setQuantity(newQuantity);
    setShowEditForm(false);
  };

  const handleMoveSuccess = () => {
    setShowMoveForm(false);
    window.location.reload(); // Still reload for move since it changes the location structure
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
        onSuccess={handleMoveSuccess}
      />
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <span className='font-medium text-sm'>{quantity}</span>
      <button
        onClick={() => setShowEditForm(true)}
        className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200'
      >
        Edit Qty
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
      onSuccess(state.newQuantity);
    }
  }, [state, onSuccess]);

  // Reset form when cancelled or when currentQuantity prop changes
  useEffect(() => {
    setQuantity(currentQuantity);
  }, [currentQuantity]);

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
        onClick={() => {
          setQuantity(currentQuantity); // Reset to original value
          onCancel();
        }}
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
      className='flex flex-col gap-2 p-2 border rounded mt-2'
    >
      <input type='hidden' name='assignmentId' value={assignmentId} />

      <div className='flex items-center gap-2'>
        <select
          name='newLocationId'
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className='flex-1 px-3 py-2 border rounded text-sm'
          required
        >
          <option value=''>Select new location</option>
          {availableLocations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.code} - {location.description || 'No description'}
            </option>
          ))}
        </select>
      </div>

      <div className='flex gap-2 justify-end'>
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1 bg-gray-200 rounded text-sm'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-3 py-1 bg-green-600 text-white rounded text-sm'
          disabled={!selectedLocation}
        >
          Confirm Move
        </button>
      </div>

      {state?.error && (
        <p className='text-red-500 text-xs mt-1'>{state.error}</p>
      )}
    </form>
  );
}
