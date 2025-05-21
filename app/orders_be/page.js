import { auth } from '@/auth';
import { SignInButton } from '@/components/sign-in-button';
import Paginations from '@/components/pagination';
import AllOrders from '@/components/AllOrders';

const Database = async ({ searchParams }) => {
  const session = await auth();

  const page = await searchParams['page'];
  const account = 'BE';
  const myRnId = () => parseInt(Date.now() * Math.random());

  if (session?.user.name == 'ilxli-nl') {
    return (
      <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
        <main
          key={myRnId()}
          className='flex flex-col gap-8 row-start-2 items-center sm:items-start'
        >
          <Paginations />

          {/* <OrdersBE page={page} account={account} /> */}
          <AllOrders page={page} account={account} />

          <Paginations />
        </main>
      </div>
    );
  }
  return (
    <div>
      <p> You Are Not Signed In</p> <SignInButton />
    </div>
  );
};
export default Database;
