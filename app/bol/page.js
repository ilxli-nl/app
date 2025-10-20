// app/bol-sync/page.js
import { auth } from '@/auth';
import BolSyncClient from './BolSyncClient';

export default async function BolSyncPage() {
  const session = await auth();

  if (session?.user?.name === 'ilxli-nl') {
    return <BolSyncClient />;
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-gray-800 mb-4'>Access Denied</h1>
        <p className='text-gray-600'>
          You don&apos;t have permission to access this page.
        </p>
      </div>
    </div>
  );
}
