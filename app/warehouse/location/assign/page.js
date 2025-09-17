import LocationForm from '@/components/warehouse/LocationForm';
import ProductForm from '@/components/warehouse/ProductForm';
import AssignProductForm from '@/components/warehouse/AssignProductForm';
import LocationScanner from '@/components/warehouse/LocationScanner';
import ProductScanner from '@/components/warehouse/ProductScanner';

export default function WarehousePage() {
  return (
    <div className='container mx-auto px-2 py-8'>
      <h1 className='text-3xl font-bold mb-8'>Warehouse Management</h1>
      <div className='grid grid-cols-1'>
        <div className='space-y-8'>
          <div className='bg-white rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>
              Assign Product to Location
            </h2>
            <AssignProductForm />
          </div>
        </div>
      </div>
    </div>
  );
}
