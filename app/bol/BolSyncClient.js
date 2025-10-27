// app/bol-sync/BolSyncClient.js
'use client';

import { useState, useTransition, useEffect } from 'react';
import LabelDetails from './LabelDetails';
import BarcodeScanner from './BarcodeScanner';
import {
  UpdateBolBarcodes,
  getOrders,
  getLabels,
  updateBarcode,
  getProductImages,
  getProductImagesFromProductImage,
  syncSpecificOrders,
} from '../actions/orderActions';
import Image from 'next/image';

export default function BolSyncClient() {
  const [result, setResult] = useState('');
  const [isPending, startTransition] = useTransition();
  const [orders, setOrders] = useState([]);
  const [labels, setLabels] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingBarcode, setEditingBarcode] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    fetchOrdersAndLabels();
  }, []);

  const fetchOrdersAndLabels = async () => {
    setLoading(true);
    try {
      const ordersRes = await getOrders(2000);
      const labelsRes = await getLabels();

      // FIX: Add proper error handling for undefined data
      const ordersData = ordersRes?.success ? ordersRes.data || [] : [];
      const labelsData = labelsRes?.success ? labelsRes.data || [] : [];

      setOrders(ordersData);
      setLabels(labelsData);

      console.log('Loaded orders:', ordersData.length);
      console.log('Loaded labels:', labelsData.length);

      // Only proceed with product images if we have orders with EANs
      if (ordersData.length > 0) {
        const eans = [...new Set(ordersData.map((o) => o.ean).filter(Boolean))];

        console.log('Unique EANs found:', eans.length);

        if (eans.length > 0) {
          try {
            const imgRes = await getProductImages(eans);
            if (imgRes?.success && imgRes.data && imgRes.data.length > 0) {
              const map = {};
              imgRes.data.forEach((i) => (map[i.ean] = i.image));
              setProductImages(map);
              console.log(
                'Loaded product images from getProductImages:',
                Object.keys(map).length
              );
            } else {
              // Fallback to alternative image source
              const prodImgRes = await getProductImagesFromProductImage(eans);
              if (prodImgRes?.success && prodImgRes.data) {
                const map = {};
                prodImgRes.data.forEach((i) => (map[i.ean] = i.imageUrl));
                setProductImages(map);
                console.log(
                  'Loaded product images from fallback:',
                  Object.keys(map).length
                );
              }
            }
          } catch (imgError) {
            console.error('Error loading product images:', imgError);
            // Continue without product images - this is not critical
          }
        }
      }
    } catch (e) {
      console.error('Error in fetchOrdersAndLabels:', e);
      setResult('Error loading data: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    startTransition(async () => {
      setResult('Syncing with Bol.com...');
      try {
        const res = await UpdateBolBarcodes(1, 'NL');
        setResult(res?.message || 'Sync completed');
        await fetchOrdersAndLabels();
      } catch (error) {
        setResult('Sync failed: ' + (error.message || 'Unknown error'));
      }
    });
  };

  const handleRowClick = (orderItemId) => {
    console.log('Clicked order item ID:', orderItemId);
    console.log('All orders:', orders);
    const selectedOrderData = orders.find(
      (order) => order.orderItemId === orderItemId
    );
    console.log('Selected order data:', selectedOrderData);

    setSelectedOrder(orderItemId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const startEdit = (id, val) => {
    setEditingBarcode(id);
    setBarcodeInput(val || '');
  };

  const saveBarcode = async (id) => {
    try {
      const result = await updateBarcode(id, barcodeInput);
      if (result?.success) {
        await fetchOrdersAndLabels();
        setResult('Barcode updated successfully');
        setEditingBarcode(null);
        setBarcodeInput('');
      } else {
        setResult('Error: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      setResult(
        'Error updating barcode: ' + (error.message || 'Unknown error')
      );
    }
  };

  const cancelEdit = () => {
    setEditingBarcode(null);
    setBarcodeInput('');
  };

  const getLabel = (orderItemId) =>
    labels.find((l) => l.orderItemId === orderItemId);

  const getProductImage = (order) => {
    if (!order) return null;
    if (order.productImage) return order.productImage;
    if (order.orderImage) return order.orderImage;
    if (order.ean && productImages[order.ean]) return productImages[order.ean];
    return null;
  };

  const getRowStyle = (currentOrder, index) => {
    if (!currentOrder) return {};

    const prevOrder = index > 0 ? orders[index - 1] : null;
    const nextOrder = index < orders.length - 1 ? orders[index + 1] : null;

    if (
      (prevOrder && currentOrder.orderId === prevOrder.orderId) ||
      (nextOrder && currentOrder.orderId === nextOrder.orderId)
    ) {
      return { backgroundColor: '#ffdede' };
    }
    return {};
  };

  if (loading) {
    return (
      <div className='p-6'>
        <h1 className='text-xl font-bold mb-4'>Bol.com Sync</h1>
        <div className='animate-pulse'>Loading orders...</div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='text-xl font-bold mb-4'>Bol.com Sync</h1>

      {/* Tab Navigation */}
      <div className='mb-6'>
        <div className='flex space-x-2 border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders Overview
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'scanner'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Barcode Scanner
          </button>
        </div>
      </div>

      {/* Sync Button - Show only on orders tab */}
      {activeTab === 'orders' && (
        <div className='mb-6'>
          <div className='flex space-x-2'>
            <button
              onClick={handleSync}
              disabled={isPending}
              className='bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400 hover:bg-blue-700 transition-colors'
            >
              {isPending ? 'Syncing...' : 'Sync Orders'}
            </button>
          </div>
          {result && (
            <p
              className={`mt-2 text-sm ${
                result.includes('Error') ||
                result.includes('Failed') ||
                result.includes('No matching')
                  ? 'text-red-600'
                  : result.includes('Updated') ||
                    result.includes('successfully') ||
                    result.includes('synced')
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              {result}
            </p>
          )}
        </div>
      )}

      {/* Conditional Content Rendering */}
      {activeTab === 'orders' ? (
        // Orders Table
        <div className='bg-white shadow rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order Number
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Address
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Product
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Shipping Barcode
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {orders && orders.length > 0 ? (
                  orders.map((order, index) => {
                    if (!order) return null;

                    const label = getLabel(order.orderItemId);
                    const productImage = getProductImage(order);
                    const rowStyle = getRowStyle(order, index);

                    return (
                      <tr
                        key={order.orderItemId}
                        className='hover:bg-gray-50'
                        style={rowStyle}
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div
                            className='flex items-center space-x-3 cursor-pointer'
                            onClick={() => handleRowClick(order.orderItemId)}
                          >
                            <div className='flex-shrink-0'>
                              {productImage ? (
                                <Image
                                  src={productImage}
                                  alt={order.title || 'Product image'}
                                  width={50}
                                  height={50}
                                  className='w-10 h-10 object-cover rounded border'
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-10 h-10 bg-gray-200 rounded border flex items-center justify-center ${
                                  productImage ? 'hidden' : 'flex'
                                }`}
                              >
                                <span className='text-xs text-gray-500'>
                                  No Image
                                </span>
                              </div>
                            </div>
                            <div className='text-sm font-medium text-gray-900'>
                              {order.orderId || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center justify-between'>
                            <div className='text-sm text-gray-500'>
                              <div className=''>
                                <h2>
                                  <strong>
                                    {order.s_firstName || ''}{' '}
                                    {order.s_surname || ''}
                                  </strong>
                                </h2>
                                {order.s_streetName} {order.s_houseNumber}
                                {order.s_houseNumberExtension &&
                                  ` ${order.s_houseNumberExtension}`}
                              </div>
                              <div>
                                {order.s_zipCode} {order.s_city}
                              </div>
                            </div>
                            <div className='flex items-center justify-center min-w-[80px]'>
                              <div
                                className={`text-4xl mr-5 font-bold rounded-lg px-3 py-2 text-center ${
                                  order.s_countryCode === 'NL'
                                    ? 'text-orange-600 bg-orange-100'
                                    : order.s_countryCode === 'BE'
                                    ? 'text-green-600 bg-green-100'
                                    : 'text-gray-600 bg-gray-100'
                                }`}
                              >
                                {order.s_countryCode || '??'}
                              </div>
                              <div
                                className={`text-4xl font-bold rounded-lg px-3 py-2 text-center ${
                                  order.s_countryCode === 'NL'
                                    ? 'text-orange-600 bg-orange-100'
                                    : order.s_countryCode === 'BE'
                                    ? 'text-green-600 bg-green-100'
                                    : 'text-gray-600 bg-gray-100'
                                }`}
                              >
                                {order.quantity || 0}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-500'>
                          <div
                            className='max-w-xs truncate'
                            title={order.title}
                          >
                            {order.title || 'No title'}
                          </div>
                          <div className='text-xs text-gray-400 mt-1'>
                            <div>
                              Qty: {order.quantity || 0} × €
                              {order.unitPrice?.toFixed(2) || '0.00'}
                            </div>
                            {order.ean && <div>EAN: {order.ean}</div>}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {editingBarcode === order.orderItemId ? (
                            <div className='flex items-center space-x-2'>
                              <input
                                type='text'
                                value={barcodeInput}
                                onChange={(e) =>
                                  setBarcodeInput(e.target.value)
                                }
                                className='border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Enter barcode'
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span
                              className={
                                label?.Barcode
                                  ? 'text-green-600 font-medium'
                                  : 'text-gray-400'
                              }
                            >
                              {label?.Barcode || 'No Barcode'}
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          {editingBarcode === order.orderItemId ? (
                            <div className='flex space-x-2'>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveBarcode(order.orderItemId);
                                }}
                                className='text-green-600 hover:text-green-900 font-medium'
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEdit();
                                }}
                                className='text-gray-600 hover:text-gray-900'
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(
                                  order.orderItemId,
                                  label?.Barcode || ''
                                );
                              }}
                              className='text-blue-600 hover:text-blue-900 font-medium'
                            >
                              {label?.Barcode ? 'Edit' : 'Add'} Barcode
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan='5'
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Barcode Scanner
        <BarcodeScanner />
      )}

      {/* Modal Backdrop and Container */}
      {showModal && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
            onClick={closeModal}
          ></div>

          {/* Modal Container */}
          <div className='flex min-h-full items-center justify-center p-4'>
            <div
              className='relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className='absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors'
              >
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>

              {/* Modal Content */}
              <div className='max-h-[90vh] overflow-y-auto'>
                <LabelDetails
                  orderItemId={selectedOrder}
                  allOrders={orders}
                  getProductImage={getProductImage}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
