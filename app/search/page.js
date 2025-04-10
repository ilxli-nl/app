// app/search/page.js
import { auth } from '@/auth';
import { SearchForm } from './SearchForm';
import { searchOrders } from '../actions/search';
import OrderDone from '../components/Order_done';

export default async function SearchPage({ searchParams }) {
  const session = await auth();
  const query = (await searchParams.q) || '';
  const results = query ? await searchOrders(query) : [];
  if (session?.user.name == 'ilxli-nl') {
    return (
      <div className='items-center justify-items-center'>
        <h1 className='text-2xl font-bold mb-4'>Order Search</h1>
        <SearchForm initialQuery={query} />
        {query && (
          <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
            <h2 className='text-xl font-semibold mb-4'>Results for {query}</h2>

            {results.length === 0 ? (
              <p className='text-gray-500'>No orders found</p>
            ) : (
              <ul>
                {results.map((order) => (
                  <li key={order.orderId}>
                    <OrderDone data={order}></OrderDone>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
}
