import LocationForm from '@/components/warehouse_bc/LocationForm';
import ProductForm from '@/components/warehouse_bc/ProductForm';
import AssignProductForm from '@/components/warehouse_bc/AssignProductForm';
import LocationScanner from '@/components/warehouse_bc/LocationScanner';
import ProductScanner from '@/components/warehouse_bc/ProductScanner';

export default function WarehousePage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>Warehouse Management</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <div className='space-y-8'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>Add New Location</h2>
            <LocationForm />
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>Add New Product</h2>
            <ProductForm />
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>Scan Product</h2>
            <ProductScanner />
          </div>
        </div>

        <div className='space-y-8'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>
              Assign Product to Location
            </h2>
            <AssignProductForm />
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>Scan Location</h2>
            <LocationScanner />
          </div>
        </div>
      </div>
    </div>
  );
}
