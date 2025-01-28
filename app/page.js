import { Suspense } from 'react'
import { auth } from '@/auth'
import { Orders } from './actions/actions'
import Order from './components/order'
import Link from 'next/link'
import { SignOutButton } from './components/sign-out-button'
import { SignInButton } from './components/sign-in-button'

export default async function Home() {
  const session = await auth()
  const orders = await Orders()
  if (session?.user) {
    return (
      <>
        <div>
          <Link href='/user-info'> User Info </Link>
          <SignOutButton />
        </div>
        <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
          <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
            {/* <a href="#" class="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
        <img class="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg" src="/docs/images/blog/image-4.jpg" alt="">
        <div class="flex flex-col justify-between p-4 leading-normal">
            <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Noteworthy technology acquisitions 2021</h5>
            <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
        </div>
    </a> */}

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
    )
  }

  return (
    <div>
      <p> You Are Not Signed In</p> <SignInButton />
    </div>
  )
}
