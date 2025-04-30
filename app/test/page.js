// app/search/page.js
import { auth } from '@/auth';

export default async function SearchPage({ searchParams }) {
  const session = await auth();

  if (session?.user.name == 'ilxli-nl') {
    return (
      <div className='items-center justify-items-center'>
        <h1 className='text-2xl font-bold mb-4'>Order Search</h1>
      </div>
    );
  }
}
