'use client';

import { useState, useTransition, useEffect } from 'react';
import { 
  UpdateBolBarcodes, 
  getOrders, 
  getLabels, 
  updateBarcode, 
  getProductImages, 
  getProductImagesFromProductImage 
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
    try {
      setLoading(true);
      setResult('Loading orders and labels...');
      
      const ordersResult = await getOrders(2000);
      const labelsResult = await getLabels();

      if (ordersResult.success) {
        setOrders(ordersResult.data);
        console.log('Loaded orders:', ordersResult.data.length);
        
        // Fetch product images for orders that have EANs
        const eans = [...new Set(ordersResult.data.map(order => order.ean).filter(ean => ean))];
        console.log('Unique EANs to fetch images for:', eans);
        
        if (eans.length > 0) {
          // Try to get images from Images table first
          const imagesResult = await getProductImages(eans);
          if (imagesResult.success && imagesResult.data.length > 0) {
            console.log('Found images in Images table:', imagesResult.data.length);
            const imagesMap = {};
            imagesResult.data.forEach(image => {
              imagesMap[image.ean] = image.image;
            });
            setProductImages(imagesMap);
          } else {
            // If no images in Images table, try ProductImage table
            console.log('No images in Images table, trying ProductImage table...');
            const productImagesResult = await getProductImagesFromProductImage(eans);
            if (productImagesResult.success && productImagesResult.data.length > 0) {
              console.log('Found images in ProductImage table:', productImagesResult.data.length);
              const imagesMap = {};
              productImagesResult.data.forEach(image => {
                imagesMap[image.ean] = image.imageUrl;
              });
              setProductImages(imagesMap);
            } else {
              console.log('No images found in any table');
            }
          }
        } else {
          console.log('No EANs found in orders');
        }

        // Log some sample orders to debug
        if (ordersResult.data.length > 0) {
          console.log('Sample orders:', ordersResult.data.slice(0, 3).map(order => ({
            orderId: order.orderId,
            ean: order.ean,
            img: order.img,
            title: order.title
          })));
        }
      } else {
        setResult('Error loading orders: ' + ordersResult.error);
        console.error('Orders error:', ordersResult.error);
      }

      if (labelsResult.success) {
        setLabels(labelsResult.data);
        console.log('Loaded labels:', labelsResult.data.length);
      } else {
        setResult('Error loading labels: ' + labelsResult.error);
        console.error('Labels error:', labelsResult.error);
      }

      if (ordersResult.success && labelsResult.success) {
        setResult('');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setResult('Error loading orders and labels: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add the missing handleSync function
  const handleSync = () => {
    startTransition(async () => {
      setResult('Syncing with Bol.com...');
      const res = await UpdateBolBarcodes(1, 'NL');
      setResult(res.message);
      // Refresh data after sync
      fetchOrdersAndLabels();
    });
  };

  const startEditBarcode = (orderItemId, currentBarcode) => {
    setEditingBarcode(orderItemId);
    setBarcodeInput(currentBarcode || '');
  };

  const saveBarcode = async (orderItemId) => {
    try {
      setResult('Updating Barcode...');
      const result = await updateBarcode(orderItemId, barcodeInput);

      if (result.success) {
        // Update local labels state
        const updatedLabels = [...labels];
        const order = orders.find(o => o.orderItemId === orderItemId);
        
        if (order) {
          const existingLabelIndex = updatedLabels.findIndex(label => label.order === order.orderId);
          
          if (existingLabelIndex >= 0) {
            // Update existing label
            updatedLabels[existingLabelIndex] = {
              ...updatedLabels[existingLabelIndex],
              Barcode: barcodeInput,
              orderItemId: orderItemId
            };
          } else {
            // Add new label
            updatedLabels.push({
              order: order.orderId,
              orderItemId: orderItemId,
              Name: `${order.s_firstName} ${order.s_surname}`,
              Address: `${order.s_streetName} ${order.s_houseNumber}, ${order.s_zipCode} ${order.s_city}`,
              Barcode: barcodeInput
            });
          }
        }
        
        setLabels(updatedLabels);
        setEditingBarcode(null);
        setBarcodeInput('');
        setResult('Barcode updated successfully');
      } else {
        setResult('Error updating Barcode: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving Barcode:', error);
      setResult('Error updating Barcode: ' + error.message);
    }
  };

  const cancelEdit = () => {
    setEditingBarcode(null);
    setBarcodeInput('');
  };

  const getLabelForOrder = (orderItemId) => {
    const order = orders.find(o => o.orderItemId === orderItemId);
    if (!order) return null;
    
    // Find label by order field (orderId) since that's the unique identifier
    return labels.find(label => label.order === order.orderId);
  };

  const getProductImage = (order) => {
    console.log('Getting image for order:', {
      orderId: order.orderId,
      ean: order.ean,
      hasImgField: !!order.img,
      hasImageInMap: !!(order.ean && productImages[order.ean])
    });

    // First try to get image from productImages map using EAN
    if (order.ean && productImages[order.ean]) {
      console.log('Using image from productImages map for EAN:', order.ean);
      return productImages[order.ean];
    }
    // Fallback to img field from Orders if available
    if (order.img) {
      console.log('Using image from Orders.img field:', order.img);
      return order.img;
    }
    console.log('No image found for order:', order.orderId);
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Bol.com Sync</h1>
        <div className="animate-pulse">Loading orders...</div>
        {result && <p className="mt-4 text-sm text-blue-600">{result}</p>}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Bol.com Sync</h1>
      
      <div className="mb-6">
        <button 
          onClick={handleSync} 
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400"
        >
          {isPending ? 'Syncing...' : 'Sync Orders'}
        </button>
        {result && (
          <p className={`mt-4 text-sm ${
            result.includes('Error') ? 'text-red-600' : 
            result.includes('Loading') || result.includes('Syncing') ? 'text-blue-600' : 
            'text-green-600'
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const label = getLabelForOrder(order.orderItemId);
                const productImage = getProductImage(order);
                
                return (
                  <tr key={order.orderItemId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center space-x-3">
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt={order.title}
                            className="w-10 h-10 object-cover rounded border"
                            onError={(e) => {
                              console.log('Image failed to load:', productImage);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 bg-gray-200 rounded border flex items-center justify-center ${productImage ? 'hidden' : 'flex'}`}
                        >
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                        <span>{order.orderId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.s_firstName} {order.s_surname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.s_streetName} {order.s_houseNumber}<br />
                      {order.s_zipCode} {order.s_city}<br />
                      {order.s_countryCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={order.title}>
                        {order.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        Qty: {order.quantity} × €{order.unitPrice?.toFixed(2)}
                        {order.ean && <div>EAN: {order.ean}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingBarcode === order.orderItemId ? (
                        <input
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                          placeholder="Enter Barcode"
                          autoFocus
                        />
                      ) : (
                        <span className={label?.Barcode ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {label?.Barcode || 'No Barcode'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingBarcode === order.orderItemId ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveBarcode(order.orderItemId)}
                            className="text-green-600 hover:text-green-900"
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
                          onClick={() => startEditBarcode(order.orderItemId, label?.Barcode || '')}
                          className="text-blue-600 hover:text-blue-900"
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