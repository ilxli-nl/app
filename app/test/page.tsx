"use client"
import { useState, useEffect } from 'react';
import { Orders, OrderBol } from '../actions/actions';
import {  createBpostLabel } from '../actions/bpost';
interface Order {
  orderId: string;
  dateTimeOrderPlaced: string;
  // Add other order properties based on your data structure
}

interface OrderDetail {
  orderId: string;
  orderItemId: string;
  title: string;
  ean: string;
  img: string;
  quantity: number;
  unitPrice: number;
  streetName: string;
  number: string;
  locality: string;
  postalCode: string;
  countryCode: string;
  name: string;
  // Add other order item properties
}

export default function OrderManager() {
  const  account  = 'BE';
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail[]>>({});
  const [selectedItems, setSelectedItems] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState({
    orders: false,
    details: false,
    labels: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [labelResults, setLabelResults] = useState<Array<{success: boolean, message: string}>>([]);

  // Fetch all orders on mount and page change
  useEffect(() => {
    const fetchAllOrders = async () => {
      if (!account) return;
      
      setLoading(prev => ({ ...prev, orders: true }));
      setError(null);
      
      try {
        const data = await Orders(page, account);
        setOrders(data);
        
        // Automatically fetch details for all orders
        await Promise.all(data.map(order => fetchOrderDetails(order.orderId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(prev => ({ ...prev, orders: false }));
      }
    };

    fetchAllOrders();
  }, [page, account]);

  // Fetch order details
  const fetchOrderDetails = async (orderId: string) => {
    if (!account || orderDetails[orderId]) return;
    
    setLoading(prev => ({ ...prev, details: true }));
    
    try {
      const details = await OrderBol(orderId, account);
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: details,
      }));
    } catch (err) {
      console.error(`Failed to fetch details for order ${orderId}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Toggle item selection
  const toggleItemSelection = (item: OrderDetail) => {
    setSelectedItems(prev => {
      const existingIndex = prev.findIndex(i => i.orderItemId === item.orderItemId);
      if (existingIndex >= 0) {
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        return [...prev, item];
      }
    });
  };

  // Generate shipping labels for each selected item individually
const generateLabels = async () => {
  if (selectedItems.length === 0) return;
  
  setLoading(prev => ({ ...prev, labels: true }));
  setError(null);
  setLabelResults([]);
  
  const results = [];
  
  for (const item of selectedItems) {
    try {
      // Validate required shipment details
      const requiredFields = [
        'streetName',
        'number', 
        'locality',
        'postalCode'
      ];
      
      const missingFields = requiredFields.filter(field => !item[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing shipment details: ${missingFields.join(', ')}`);
      }

      const formData = new FormData();
      formData.append('name', item.name || '');
      formData.append('streetName', item.streetName);
      formData.append('number', item.number);
      formData.append('locality', item.locality);
      formData.append('postalCode', item.postalCode);
      formData.append('countryCode', item.countryCode || 'BE');
      formData.append('phoneNumber', item.phoneNumber || '+32 0 000 00 00');
      formData.append('email', item.email || '');
      formData.append('orderReference', item.orderId);
      formData.append('shipping', 'bpack 24h pro');

      console.log('Submitting to bpost:', {
        orderId: item.orderId,
        address: {
          streetName: item.streetName,
          number: item.number,
          locality: item.locality,
          postalCode: item.postalCode,
          countryCode: item.countryCode
        }
      });

      const result = await createBpostLabel(formData);
      results.push({ 
        success: true, 
        message: `Label created for order ${item.orderId}`,
        tracking: result.trackingNumber // Adjust based on actual API response
      });
    } catch (err) {
      results.push({ 
        success: false, 
        message: `Failed to create label for ${item.orderId}: ${err.message}`,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
  
  setLabelResults(results);
  setLoading(prev => ({ ...prev, labels: false }));
};
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Orders List - Always Expanded */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Orders (Page {page})</h2>
        {loading.orders ? (
          <p>Loading orders...</p>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p>No orders found</p>
            ) : (
              orders.map(order => (
                <div key={order.orderId} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Order #{order.orderId}</span>
                    <span>{new Date(order.dateTimeOrderPlaced).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Order Details - Always Visible */}
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-medium mb-2">Order Items:</h3>
                    {loading.details && !orderDetails[order.orderId] ? (
                      <p>Loading items...</p>
                    ) : (
                      <div className="space-y-3">
                        {orderDetails[order.orderId]?.map(item => (
                          <div key={item.orderItemId} className="flex items-start p-2 border rounded">
                            <input
                              type="checkbox"
                              checked={selectedItems.some(i => i.orderItemId === item.orderItemId)}
                              onChange={() => toggleItemSelection(item)}
                              className="mt-1 mr-3"
                            />
                            <img 
                              src={item.img} 
                              alt={item.title} 
                              className="w-16 h-16 object-contain mr-3"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/no_image.jpg';
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <p>EAN: {item.ean}</p>
                              <p>Qty: {item.quantity} × €{item.unitPrice.toFixed(2)}</p>
                              <div className="mt-2 text-sm text-gray-600">
                                <p>Ship to: {item.name}</p>
                                <p>{item.streetName} {item.number}, {item.postalCode} {item.locality}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Pagination */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading.orders}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading.orders}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Selected Items ({selectedItems.length})
            <button
              onClick={generateLabels}
              disabled={loading.labels}
              className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.labels ? 'Generating Labels...' : 'Generate Shipping Labels'}
            </button>
          </h2>
          
          <ul className="space-y-2 mb-4">
            {selectedItems.map(item => (
              <li key={item.orderItemId} className="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-gray-600 ml-2">(Order: {item.orderId})</span>
                </div>
                <button
                  onClick={() => toggleItemSelection(item)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          
          {/* Label Generation Results */}
          {labelResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Label Generation Results:</h3>
              <ul className="space-y-2">
                {labelResults.map((result, index) => (
                  <li 
                    key={index} 
                    className={`p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {result.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}