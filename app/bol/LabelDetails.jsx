'use client';

import { useState, useEffect } from 'react';
import { getOrderWithLabel } from '../actions/orderActions';
import Image from 'next/image';

export default function LabelDetails({ orderItemId, allOrders, getProductImage }) {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderItemId) {
      fetchOrderDetails();
    }
  }, [orderItemId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getOrderWithLabel(orderItemId);
      
      if (result.success) {
        setOrderData(result.data);
      } else {
        setError(result.error || 'Failed to fetch order details');
      }
    } catch (err) {
      setError('Error loading order details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get all items for the same order
  const getAllOrderItems = () => {
    if (!orderData || !allOrders) return [];
    
    const currentOrderId = orderData.order.orderId;
    return allOrders.filter(order => order.orderId === currentOrderId);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchOrderDetails}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">No order data found</p>
      </div>
    );
  }

  const { order, label } = orderData;
  const allOrderItems = getAllOrderItems();
  const totalOrderValue = allOrderItems.reduce((total, item) => {
    return total + ((item.quantity || 1) * (item.unitPrice || 0));
  }, 0);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-800">Order & Label Details</h2>
        <p className="text-sm text-gray-600 mt-1">Order ID: {order.orderId}</p>
        <p className="text-sm text-gray-600">Total Items: {allOrderItems.length}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Order Information */}
        <div className="space-y-6">
          {/* Order Items Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Items ({allOrderItems.length})</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {allOrderItems.map((item, index) => {
                const productImage = getProductImage(item);
                return (
                  <div key={item.orderItemId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt={item.title}
                            width={50}
            height={50}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-16 h-16 bg-gray-200 rounded border flex items-center justify-center ${
                            productImage ? 'hidden' : 'flex'
                          }`}
                        >
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>Qty: {item.quantity}</div>
                          <div>Price: €{item.unitPrice?.toFixed(2)}</div>
                          <div>Total: €{((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</div>
                          {item.ean && <div className="col-span-2">EAN: {item.ean}</div>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Item ID: {item.orderItemId}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Order Total:</span>
                <span className="text-lg font-bold text-gray-900">€{totalOrderValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Shipping Address</h3>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-900">
                {order.s_salutationCode} {order.s_firstName} {order.s_surname}
              </p>
              <p className="text-sm text-gray-900">
                {order.s_streetName} {order.s_houseNumber}
                {order.s_houseNumberExtension && ` ${order.s_houseNumberExtension}`}
              </p>
              <p className="text-sm text-gray-900">
                {order.s_zipCode} {order.s_city}
              </p>
              <p className="text-sm text-gray-900">
                {order.s_countryCode}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Email: {order.email}
              </p>
            </div>
          </div>

          {/* Billing Address (if different) */}
          {(order.b_streetName || order.b_company) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Billing Address</h3>
              
              <div className="space-y-2">
                {order.b_company && (
                  <p className="text-sm text-gray-900 font-medium">{order.b_company}</p>
                )}
                <p className="text-sm text-gray-900">
                  {order.b_salutationCode} {order.b_firstName} {order.b_surname}
                </p>
                <p className="text-sm text-gray-900">
                  {order.b_streetName} {order.b_houseNumber}
                  {order.b_houseNumberExtension && ` ${order.b_houseNumberExtension}`}
                </p>
                <p className="text-sm text-gray-900">
                  {order.b_zipCode} {order.b_city}
                </p>
                <p className="text-sm text-gray-900">
                  {order.b_countryCode}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Label Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Shipping Label Information</h3>
            
            {label ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Barcode</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border">
                    {label.Barcode || 'No barcode assigned'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Label Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(label.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(label.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(label.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(label.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Shipping Address from Label</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                    <pre className="whitespace-pre-wrap font-sans">{label.Address}</pre>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Recipient Name</label>
                  <p className="mt-1 text-sm text-gray-900">{label.Name}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-600 font-medium">No shipping label found</p>
                <p className="text-sm text-yellow-500 mt-1">This order doesn't have a shipping label yet.</p>
              </div>
            )}
          </div>

          {/* Order Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Timeline</h3>
            
            <div className="space-y-3">
              {order.dateTimeOrderPlaced && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Order Placed:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(order.dateTimeOrderPlaced).toLocaleString()}
                  </span>
                </div>
              )}
              
              {order.latestDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Latest Delivery:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(order.latestDeliveryDate).toLocaleString()}
                  </span>
                </div>
              )}
              
              {order.qls_time && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">QLS Time:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(order.qls_time).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
          <button
            onClick={fetchOrderDetails}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}