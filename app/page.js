//import { auth } from '@/auth';
import { Orders } from './actions/actions';
import Order from './components/order';
import Link from 'next/link';
import { SignOutButton } from './components/sign-out-button';
import { SignInButton } from './components/sign-in-button';

export default async function Home() {
  //const session = await auth();
  const orders = await Orders();
  // if (session?.user) {
  return (
    <>
      <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
        <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
          <ul>
            {orders.map((order) => (
              <li key={order.orderId}>
                <Order ordId={order.orderId} />
              </li>
            ))}
          </ul>
        </main>
      </div>
    </>
  );
  // }

  // return (
  //   <div>
  //     <p> You Are Not Signed In</p> <SignInButton />
  //   </div>
  // );
}
