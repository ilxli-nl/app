'use client';

import { useState, useRef, useEffect } from 'react';
import { registerBarcodeScan, getRecentScans } from '../actions/scanActions';

export default function BarcodeScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showScanDetails, setShowScanDetails] = useState(false);
  const inputRef = useRef(null);

  // Load recent scans on component mount
  useEffect(() => {
    loadRecentScans();
  }, []);

  // Focus input when scanner is shown
  useEffect(() => {
    if (showScanner && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showScanner]);

  const loadRecentScans = async () => {
    const result = await getRecentScans(10);
    if (result.success) {
      setRecentScans(result.data);
    }
  };

  const handleScan = async (barcode = barcodeInput) => {
    if (!barcode.trim()) return;

    setLoading(true);
    setScanResult(null);
    setShowScanDetails(true);

    try {
      const result = await registerBarcodeScan(barcode.trim(), 'operator');
      
      setScanResult(result);
      
      if (result.success) {
        setBarcodeInput('');
        await loadRecentScans(); // Refresh recent scans
      }
    } catch (error) {
      setScanResult({
        success: false,
        error: 'Scan failed: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleBarcodeInput = (e) => {
    const value = e.target.value;
    setBarcodeInput(value);
    
    // Auto-submit if barcode is detected (usually barcode scanners send Enter key)
    if (value.length >= 8 && (value.includes('\n') || value.includes('\r'))) {
      const cleanBarcode = value.replace(/[\n\r]/g, '').trim();
      handleScan(cleanBarcode);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const getProductImage = (item) => {
    return item.productImage || item.orderImage;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Barcode Scanner</h2>
        <p className="text-gray-600">Scan shipping labels to register orders for shipment</p>
      </div>

      {/* Scanner Input */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-4 py-2 rounded font-medium ${
              showScanner 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {showScanner ? 'Stop Scanning' : 'Start Scanning'}
          </button>
          
          {showScanner && (
            <button
              onClick={() => {
                setBarcodeInput('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          )}
        </div>

        {showScanner && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode Input (scanner will auto-submit)
              </label>
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={handleBarcodeInput}
                onKeyPress={handleKeyPress}
                placeholder="Scan barcode or type manually and press Enter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              onClick={() => handleScan()}
              disabled={loading || !barcodeInput.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium text-lg"
            >
              {loading ? 'Processing...' : 'Register Scan Manually'}
            </button>
          </div>
        )}
      </div>

      {/* Scan Result Details */}
      {showScanDetails && scanResult && (
        <div className={`p-6 rounded-lg mb-6 border-2 ${
          scanResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                scanResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {scanResult.success ? (
                  <span className="text-green-600 text-lg">✓</span>
                ) : (
                  <span className="text-red-600 text-lg">✗</span>
                )}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${
                  scanResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.message || scanResult.error}
                </h3>
                {scanResult.success && scanResult.data && (
                  <p className="text-green-700">
                    Scanned at: {formatTime(scanResult.data.scan.scannedAt)} on {formatDate(scanResult.data.scan.scannedAt)}
                    {scanResult.isRescan && (
                      <span className="ml-2 text-orange-600 font-medium">⚠️ Rescanned</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowScanDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {scanResult.success && scanResult.data && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Order Header */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Order: {scanResult.data.order.orderId}
                    </h4>
                    <p className="text-gray-600">
                      Customer: {scanResult.data.order.s_firstName} {scanResult.data.order.s_surname}
                    </p>
                    <p className="text-gray-600">
                      {scanResult.data.order.s_streetName} {scanResult.data.order.s_houseNumber}
                      {scanResult.data.order.s_houseNumberExtension && ` ${scanResult.data.order.s_houseNumberExtension}`}
                    </p>
                    <p className="text-gray-600">
                      {scanResult.data.order.s_zipCode} {scanResult.data.order.s_city}, {scanResult.data.order.s_countryCode}
                    </p>
                  </div>
                  <div className={`text-4xl font-bold rounded-lg px-4 py-3 text-center ${
                    scanResult.data.order.s_countryCode === 'NL' 
                      ? 'text-orange-600 bg-orange-100' 
                      : scanResult.data.order.s_countryCode === 'BE' 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    {scanResult.data.order.s_countryCode}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h5 className="text-lg font-semibold text-gray-800 mb-3">
                  Order Items ({scanResult.data.allOrderItems.length})
                </h5>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {scanResult.data.allOrderItems.map((item, index) => {
                    const productImage = getProductImage(item);
                    return (
                      <div key={item.orderItemId} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex-shrink-0">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={item.title}
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
                        <div className="flex-1">
                          <h6 className="font-medium text-gray-900 text-sm">{item.title}</h6>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-1">
                            <div>Quantity: {item.quantity}</div>
                            <div>Price: €{item.unitPrice?.toFixed(2)}</div>
                            <div>Total: €{((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</div>
                            {item.ean && <div className="col-span-2">EAN: {item.ean}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Order Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    €{scanResult.data.totalOrderValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Scans */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Scans</h3>
        {recentScans.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No scans yet</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentScans.map((scan) => (
              <div key={scan.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {scan.order.orderId}
                    </p>
                    <p className="text-sm text-gray-600">
                      {scan.order.s_firstName} {scan.order.s_surname} • {scan.order.s_city}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      Barcode: {scan.barcode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(scan.scannedAt)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      scan.status === 'scanned' 
                        ? 'bg-blue-100 text-blue-800'
                        : scan.status === 'processed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">How to use:</h4>
        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>Click &quot;Start Scanning&quot; to activate the scanner</li>
          <li>Use your barcode scanner to scan shipping labels</li>
          <li>Scans are automatically registered in the database</li>
          <li>You can also type barcodes manually and press Enter</li>
          <li>Rescanning an order will update the scan timestamp</li>
        </ul>
      </div>
    </div>
  );
}