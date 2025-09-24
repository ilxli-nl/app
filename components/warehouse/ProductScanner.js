'use client';

import { useActionState, useEffect } from 'react';
import {
  scanProduct,
  updateProductQuantity,
  moveProductLocation,
  getLocations,
  getProductImages,
  getProducts,
  deleteProduct,
} from '@/components/warehouse/actions';
import { useState, useRef } from 'react';
import Image from 'next/image';

export default function ProductScanner() {
  const [state, formAction] = useActionState(scanProduct, null);
  const [deleteState, deleteFormAction] = useActionState(deleteProduct, null);
  const [scanMode, setScanMode] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch all locations and products on component mount using server actions
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch locations
        const locations = await getLocations();
        setAllLocations(locations);

        // Fetch products using server action
        const products = await getProducts();
        setAllProducts(products);
        setFilteredProducts(products);

        // Fetch images for all products
        const eans = products.map((p) => p.ean);
        const imagesResult = await getProductImages(eans);
        if (imagesResult) {
          setProductImages(imagesResult);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  // Refresh products after successful deletion
  useEffect(() => {
    if (deleteState?.success) {
      // Refresh the products list
      async function refreshProducts() {
        const products = await getProducts();
        setAllProducts(products);
        setFilteredProducts(products);
        setSelectedProduct(null);
        setSearchTerm('');
        setShowDeleteConfirm(false);
        setIsDeleting(false);
      }
      refreshProducts();
    }
  }, [deleteState]);

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.ean.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, allProducts]);

  useEffect(() => {
    // Close dropdown when clicking outside
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

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.ean); // Set the EAN for scanning
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedProduct(null);
    }
  };

  const handleSearchFocus = () => {
    if (filteredProducts.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (selectedProduct) {
      // Create a form and submit it programmatically
      const formData = new FormData();
      formData.set('productEan', selectedProduct.ean);
      await formAction(formData);
    }
  };

  const handleDeleteProduct = async () => {
    if (state?.product) {
      setIsDeleting(true);
      const formData = new FormData();
      formData.set('ean', state.product.ean);
      await deleteFormAction(formData);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  };

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
        <div className='mb-4'>
          <div className='mb-4 relative' ref={searchRef}>
            <label
              htmlFor='productSearch'
              className='block text-sm font-medium text-gray-700'
            >
              Search Product
            </label>
            <input
              type='text'
              id='productSearch'
              name='productSearch'
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder='Search by product name or EAN'
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
            />

            {showDropdown && filteredProducts.length > 0 && (
              <div
                ref={dropdownRef}
                className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className='flex items-center p-2 cursor-pointer hover:bg-gray-100'
                  >
                    {productImages[product.ean] ? (
                      <Image
                        src={productImages[product.ean]}
                        alt={product.name}
                        width={40}
                        height={40}
                        className='w-10 h-10 object-contain mr-3'
                      />
                    ) : (
                      <div className='w-10 h-10 bg-gray-200 flex items-center justify-center mr-3'>
                        <span className='text-xs text-gray-500'>No image</span>
                      </div>
                    )}
                    <div>
                      <div className='font-medium'>{product.name}</div>
                      <div className='text-sm text-gray-500'>
                        EAN: {product.ean}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={!selectedProduct}
            className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              !selectedProduct ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Search Product
          </button>
        </div>
      )}

      {state?.product && (
        <div className='mt-4 p-4 bg-gray-50 rounded'>
          <div className='flex items-start justify-between mb-4'>
            <div className='flex items-start space-x-4 flex-1'>
              {state.product.imageUrl && (
                <Image
                  width={80}
                  height={80}
                  src={state.product.imageUrl}
                  alt={state.product.name}
                  className='h-20 w-20 object-cover rounded'
                />
              )}
              <div className='flex-1'>
                <h3 className='font-bold'>{state.product.name}</h3>
                <p className='text-sm text-gray-600'>
                  EAN: {state.product.ean}
                </p>
                <p className='mt-1 text-sm'>
                  {state.product.description || 'No description available'}
                </p>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className='ml-4 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200'
            >
              Delete
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded'>
              <h4 className='font-bold text-red-800 mb-2'>Confirm Deletion</h4>
              <p className='text-sm text-red-700 mb-3'>
                Are you sure you want to delete {state.product.name} (EAN:{' '}
                {state.product.ean})? This action cannot be undone.
              </p>

              {state.locations && state.locations.length > 0 && (
                <p className='text-sm text-red-600 mb-3 font-medium'>
                  ⚠️ This product is assigned to {state.locations.length}{' '}
                  location(s). You must remove it from all locations before
                  deleting.
                </p>
              )}

              <div className='flex gap-2'>
                <button
                  onClick={handleDeleteProduct}
                  disabled={state.locations && state.locations.length > 0}
                  className={`px-3 py-1 text-sm rounded ${
                    state.locations && state.locations.length > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className='px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>

              {deleteState?.message && (
                <p
                  className={`mt-2 text-sm ${
                    deleteState.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {deleteState.message}
                </p>
              )}
            </div>
          )}

          {state.locations && state.locations.length > 0 ? (
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
                        allLocations={allLocations}
                      />
                    </div>

                    {item.history && item.history.length > 0 && (
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
                                {history.user?.username || 'Unknown user'}{' '}
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
    window.location.reload();
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
