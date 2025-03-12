'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FaGoogle } from 'react-icons/fa'
import logo from '@/assets/images/logo-white.png'
import { login, logout } from '@/lib/actions/auth'

const Navbar =  () => {


  const pathname = usePathname()


  return (
    <nav className='bg-blue-700 border-b border-blue-500'>
      <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
        <div className='relative flex h-20 items-center justify-between'>
          <div className='flex flex-1 items-center justify-center md:items-stretch md:justify-start'>
            {/* <!-- Logo --> */}
            <Link className='flex flex-shrink-0 items-center' href='/'>
              <Image className='h-10 w-auto' src={logo} alt='LitaLife' />

              <span className='hidden md:block text-white text-2xl font-bold ml-2'>
                ilxli App
              </span>
            </Link>
            {/* <!-- Desktop Menu Hidden below md screens --> */}
            <div className='hidden md:ml-6 md:block'>
              <div className='flex space-x-2'>
                <Link
                  href='/'
                  className={`${
                    pathname === '/' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Home
                </Link>
                <Link
                  href='/orders?page=1'
                  className={`${
                    pathname === '/properties' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Orders NL
                </Link>
                <Link
                  href='/orders_be?page=1'
                  className={`${
                    pathname === '/properties' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Orders BE
                </Link>

                <button className={`${
                    pathname === '/properties/add' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`} onClick={() => login()}> Sign in</button>
                
                <button  className={`${
                    pathname === '/properties/add' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`} onClick={() => logout()}> Sign out</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Mobile menu, show/hide based on menu state. --> */}
    </nav>
  )
}
export default Navbar
