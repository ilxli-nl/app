import  OrderList  from '@/components/OrderList';
import Paginations from '@/components/pagination';


function Test() {

  const myRnId = () => parseInt(Date.now() * Math.random());
  const page = 1
  const account = 'NL'
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

export default Test

