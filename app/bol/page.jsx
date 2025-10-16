'use client';

import { useState, useTransition, useEffect } from 'react';
import { 
  UpdateBolBarcodes, 
  getOrders, 
  getLabels, 
  updateBarcode, 
  getProductImages, 
  getProductImagesFromProductImage,
  syncSpecificOrders  // Add this import
} from '../actions/orderActions';

export default function BolSyncPage() {
  const [result, setResult] = useState('');
  const [isPending, startTransition] = useTransition();
  const [orders, setOrders] = useState([]);
  const [labels, setLabels] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingBarcode, setEditingBarcode] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');

  useEffect(() => {
    fetchOrdersAndLabels();
  }, []);

  const fetchOrdersAndLabels = async () => {
    setLoading(true);
    try {
      const ordersRes = await getOrders(2000);
      const labelsRes = await getLabels();

      if (ordersRes.success) {
        setOrders(ordersRes.data);
        console.log('Loaded orders with images:', ordersRes.data.length);
      }
      if (labelsRes.success) setLabels(labelsRes.data);

      // Additional image fetching for fallback (already handled in getOrders, but keeping for redundancy)
      const eans = [...new Set(ordersRes.data.map(o => o.ean).filter(Boolean))];
      if (eans.length) {
        const imgRes = await getProductImages(eans);
        if (imgRes.success && imgRes.data.length > 0) {
          const map = {};
          imgRes.data.forEach(i => (map[i.ean] = i.image));
          setProductImages(map);
        } else {
          const prodImgRes = await getProductImagesFromProductImage(eans);
          if (prodImgRes.success) {
            const map = {};
            prodImgRes.data.forEach(i => (map[i.ean] = i.imageUrl));
            setProductImages(map);
          }
        }
      }
    } catch (e) {
      setResult('Error loading data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    startTransition(async () => {
      setResult('Syncing with Bol.com...');
      const res = await UpdateBolBarcodes(1, 'NL');
      setResult(res.message);
      fetchOrdersAndLabels();
    });
  };

  const handleManualSync = async () => {
    const orderIds = prompt('Enter order IDs to sync (comma-separated):');
    if (!orderIds) return;
    
    const ids = orderIds.split(',').map(id => id.trim()).filter(id => id);
    setResult(`Manual syncing ${ids.length} orders...`);
    
    const res = await syncSpecificOrders(ids, 'NL');
    setResult(res.message);
    fetchOrdersAndLabels();
  };

  const startEdit = (id, val) => {
    setEditingBarcode(id);
    setBarcodeInput(val || '');
  };

  const saveBarcode = async (id) => {
    const result = await updateBarcode(id, barcodeInput);
    if (result.success) {
      await fetchOrdersAndLabels();
      setResult('Barcode updated successfully');
      setEditingBarcode(null);
      setBarcodeInput('');
    } else {
      setResult('Error: ' + result.error);
    }
  };

  const cancelEdit = () => {
    setEditingBarcode(null);
    setBarcodeInput('');
  };

  const getLabel = (orderItemId) => labels.find(l => l.orderItemId === orderItemId);

  const getProductImage = (order) => {
    // Use productImage from order (already processed in getOrders)
    if (order.productImage) return order.productImage;
    // Use orderImage from order (img field from Orders table)
    if (order.orderImage) return order.orderImage;
    // Fallback to productImages map
    if (order.ean && productImages[order.ean]) return productImages[order.ean];
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Bol.com Sync</h1>
        <div className="animate-pulse">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Bol.com Sync</h1>
      
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={handleSync}
            disabled={isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400 hover:bg-blue-700 transition-colors"
          >
            {isPending ? 'Syncing...' : 'Sync Orders'}
          </button>
          <button
            onClick={handleManualSync}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Manual Sync
          </button>
        </div>
        {result && (
          <p className={`mt-2 text-sm ${
            result.includes('Error') || result.includes('Failed') || result.includes('No matching') ? 'text-red-600' : 
            result.includes('Updated') || result.includes('successfully') || result.includes('synced') ? 'text-green-600' :
            'text-gray-600'
          }`}>
            {result}
          </p>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const label = getLabel(order.orderItemId);
                const productImage = getProductImage(order);
                
                return (
                  <tr key={order.orderItemId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={order.title}
                              className="w-10 h-10 object-cover rounded border"
                              onError={(e) => {
                                // Hide broken image and show placeholder
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 bg-gray-200 rounded border flex items-center justify-center ${
                              productImage ? 'hidden' : 'flex'
                            }`}
                          >
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.s_firstName} {order.s_surname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {order.s_streetName} {order.s_houseNumber}
                        {order.s_houseNumberExtension && ` ${order.s_houseNumberExtension}`}
                      </div>
                      <div>
                        {order.s_zipCode} {order.s_city}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.s_countryCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={order.title}>
                        {order.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        <div>Qty: {order.quantity} × €{order.unitPrice?.toFixed(2)}</div>
                        {order.ean && <div>EAN: {order.ean}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingBarcode === order.orderItemId ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter barcode"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className={label?.Barcode ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {label?.Barcode || 'No Barcode'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {label?.updatedAt ? (
                        <div>
                          <div>{new Date(label.updatedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(label.updatedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingBarcode === order.orderItemId ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveBarcode(order.orderItemId)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(order.orderItemId, label?.Barcode || '')}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {label?.Barcode ? 'Edit' : 'Add'} Barcode
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}