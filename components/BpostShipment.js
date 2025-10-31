// components/BpostShipment.js
'use client';

import { useState, useTransition } from 'react';
import {
  createBpostShipment,
  completeBolOrder,
} from '../app/actions/bpostActions';

export default function BpostShipment({ order, onLabelCreated }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shipmentData, setShipmentData] = useState({
    productType: 'BPACK_24H_PRO',
  });

  const handleCreateShipment = async () => {
    if (!order) {
      setResult('❌ No order data available');
      return;
    }

    setLoading(true);
    setResult('Creating Bpost shipment...');

    try {
      const formData = new FormData();
      formData.append('orderItemId', order.orderItemId);
      formData.append('productType', shipmentData.productType);

      const result = await createBpostShipment(formData);

      if (result.success) {
        setResult(`✅ ${result.message}\nBarcode: ${result.barcode}`);

        // Call callback to refresh parent component
        if (onLabelCreated) {
          onLabelCreated();
        }

        // Automatically complete the order on Bol.com
        await completeOrderOnBol(result.barcode);
      } else {
        setResult(`❌ ${result.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const completeOrderOnBol = async (barcode) => {
    setResult((prev) => prev + '\nCompleting order on Bol.com...');

    try {
      const formData = new FormData();
      formData.append('orderItemId', order.orderItemId);
      formData.append('trackingNumber', barcode);

      const result = await completeBolOrder(formData);

      if (result.success) {
        setResult((prev) => prev + '\n✅ ' + result.message);
      } else {
        setResult((prev) => prev + '\n❌ Bol.com: ' + result.error);
      }
    } catch (error) {
      setResult((prev) => prev + '\n❌ Bol.com Error: ' + error.message);
    }
  };

  const handleQuickShipment = (productType) => {
    setShipmentData((prev) => ({
      ...prev,
      productType,
    }));

    startTransition(() => {
      handleCreateShipment();
    });
  };

  if (!order) {
    return (
      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
        <p className='text-yellow-800'>No order selected for shipment</p>
      </div>
    );
  }

  // Only show for BE orders
  if (order.s_countryCode !== 'BE') {
    return (
      <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <p className='text-blue-800'>
          Bpost shipment only available for Belgian orders
        </p>
        <p className='text-sm text-blue-600 mt-1'>
          This order is for {order.s_countryCode}
        </p>
      </div>
    );
  }

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-4 mt-4'>
      <h3 className='text-lg font-semibold mb-3 text-gray-800'>
        Bpost Shipment
      </h3>

      {/* Shipment Options */}
      <div className='mb-3'>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Shipment Type
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <button
            onClick={() =>
              setShipmentData((prev) => ({
                ...prev,
                productType: 'BPACK_24H_PRO',
              }))
            }
            className={`px-3 py-2 text-sm rounded border ${
              shipmentData.productType === 'BPACK_24H_PRO'
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            bpack 24h Pro
          </button>
          <button
            onClick={() =>
              setShipmentData((prev) => ({
                ...prev,
                productType: 'BPACK_BUSINESS',
              }))
            }
            className={`px-3 py-2 text-sm rounded border ${
              shipmentData.productType === 'BPACK_BUSINESS'
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            bpack Business
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex space-x-2 mb-3'>
        <button
          onClick={handleCreateShipment}
          disabled={loading || isPending}
          className='flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors'
        >
          {loading || isPending ? 'Creating...' : 'Create Bpost Label'}
        </button>

        {/* Quick Actions */}
        <button
          onClick={() => handleQuickShipment('BPACK_24H_PRO')}
          disabled={loading || isPending}
          className='bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors'
        >
          Quick 24h
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div
          className={`p-2 rounded text-xs whitespace-pre-line ${
            result.includes('❌')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {result}
        </div>
      )}
    </div>
  );
}
