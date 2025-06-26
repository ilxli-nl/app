'use client';
import { useState } from 'react';
import {
  getProductsAndLocations,
  scanLocation,
  scanProduct,
} from '@/components/warehouse/actions'; //'@/components/warehouse/actions';
import WarehouseDashboard from '@/components/warehouse/WarehouseDashboard';
import ProductForm from '@/components/warehouse/ProductForm';
import LocationForm from '@/components/warehouse/LocationForm';
import AssignmentForm from '@/components/warehouse/AssignmentForm';
import Scanner from '@/components/warehouse/Scanner';

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanData, setScanData] = useState(null);
  const [scanMode, setScanMode] = useState(null);

  const handleScanSubmit = async (formData) => {
    try {
      let result;
      if (scanMode === 'location') {
        result = await scanLocation(null, formData);
      } else {
        result = await scanProduct(null, formData);
      }
      setScanData(result);
    } catch (error) {
      console.error('Scan error:', error);
      setScanData({ error: error.message });
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'products':
        return <ProductForm />;
      case 'locations':
        return <LocationForm />;
      case 'assign':
        return <AssignmentForm />;
      case 'scan':
        return (
          <Scanner
            mode={scanMode}
            onSubmit={handleScanSubmit}
            result={scanData}
            onModeChange={setScanMode}
          />
        );
      default:
        return <WarehouseDashboard />;
    }
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Warehouse Management</h1>

      <div className='tabs mb-6'>
        <button
          className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'products' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`tab ${activeTab === 'locations' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          Locations
        </button>
        <button
          className={`tab ${activeTab === 'assign' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          Assign Products
        </button>
        <button
          className={`tab ${activeTab === 'scan' ? 'tab-active' : ''}`}
          onClick={() => {
            setActiveTab('scan');
            setScanMode(null);
            setScanData(null);
          }}
        >
          Scanner
        </button>
      </div>

      {renderTab()}
    </div>
  );
}
