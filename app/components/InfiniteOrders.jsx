"use client"
import { useQuery } from '@tanstack/react-query';
import { Orders } from '../actions/actions';
import Order from './Order';

const InfiniteOrders = ()  => {
  const {isPending, error, data, isFetching} = useQuery({ queryKey: ['Orders'], queryFn: Orders });
    if (isPending) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

  console.log(data);
  const myRnId = () => parseInt(Date.now() * Math.random());
  return (
    <>
    <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <main key={myRnId()} className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <ul>
          {data.map((order) => (
            <li key={order.orderId}>
              <Order id={order.orderId} />
              </li>
          ))}
        </ul>
      </main>
    </div>
  </>
  );
};
export default InfiniteOrders;