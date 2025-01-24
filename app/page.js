//import Image from 'next/image';
//import Options from './actions';
import { Suspense } from 'react';
import { Orders } from './actions/actions';
import Order from './components/order';

export default async function Home() {
  const orders = await Orders();

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <ul>
          {orders.map((order) => (
            <li key={order.orderId}>
              <p>orderId: {order.orderId}</p>

              <Suspense fallback={<p>Loading feed...</p>}>
                <Order ordId={order.orderId} />
              </Suspense>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
