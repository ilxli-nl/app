import LocationForm from '@/components/warehouse/LocationForm';

export default function WarehousePage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>Warehouse Management</h1>

      <div className='grid grid-cols-1 md:grid-cols-1 gap-8'>
        <div className='space-y-8'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4'>Add New Location</h2>
            <LocationForm />
          </div>
        </div>
      </div>
    </div>
  );
}
