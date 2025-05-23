import { auth } from '@/auth';
import { SignInButton } from '@/components/sign-in-button';
import  OrderList  from '@/components/OrderList';
import Paginations from '@/components/pagination';


const Test = async ({ searchParams }) => {
const session = await auth();
  const myRnId = () => parseInt(Date.now() * Math.random());
  const page = await searchParams['page'];
  const account = 'NL'
    if (session?.user.name == 'ilxli-nl') {
    return (
 

    <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
        <main
          key={myRnId()}
          className='flex flex-col gap-8 row-start-2 items-center sm:items-start'
        >
          <Paginations />

       <OrderList page={page} account={account} />

       
          <Paginations />
        </main>
      </div>

  )
  }
  return (
    <div>
      <p> You Are Not Signed In</p> <SignInButton />
    </div>
  );
}

export default Test
