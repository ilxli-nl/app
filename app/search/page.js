// app/search/page.js
import { SearchForm } from './SearchForm';
import { searchOrders } from '../actions/search';

export default async function SearchPage({ searchParams }) {
  const query = (await searchParams.q) || '';
  const results = query ? await searchOrders(query) : [];
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Order Search</h1>
      <SearchForm initialQuery={query} />
      {query && (
        <div className='mt-8'>
          <h2 className='text-xl font-semibold mb-4'>Results for "{query}"</h2>

          {results.length === 0 ? (
            <p className='text-gray-500'>No orders found</p>
          ) : (
            <ul className='space-y-4'>
              {results.map((order) => (
                <li key={order.id} className='border p-4 rounded-lg'>
                  <h3 className='font-bold'>Order #{order.orderId}</h3>
                  <p className='text-gray-600'>{order.title}</p>
                  <p>Customer: {order.customerName}</p>
                  <p>Status: {order.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
