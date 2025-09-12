'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FaGoogle, FaChevronDown } from 'react-icons/fa'
import { useState, useRef, useEffect } from 'react'
import logo from '@/assets/images/logo-white.png'
import { login, logout } from '@/lib/actions/auth'

const Navbar = () => {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName)
  }

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
              <div className='flex space-x-2' ref={dropdownRef}>
                <Link
                  href='/'
                  className={`${
                    pathname === '/' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Home
                </Link>
                <Link
                  href='/search'
                  className={`${
                    pathname === '/properties' ? 'bg-black' : ''
                  } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Search
                </Link>
                
                {/* Orders Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('orders')}
                    className={`${
                      pathname.includes('/orders') ? 'bg-black' : ''
                    } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 flex items-center`}
                  >
                    Orders
                    <FaChevronDown className={`ml-1 transition-transform ${openDropdown === 'orders' ? 'rotate-180' : ''}`} size={12} />
                  </button>
                  
                  {openDropdown === 'orders' && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <Link
                          href='/orders?page=1'
                          className={`${
                            pathname === '/orders' ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          Orders NL
                        </Link>
                        <Link
                          href='/orders_be?page=1'
                          className={`${
                            pathname === '/orders_be' ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          Orders BE
                        </Link>
                        <Link
                          href='/orders_new?page=1'
                          className={`${
                            pathname === '/orders_new' ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          Orders NEW
                        </Link>
                      </div>
                    </div>
                  )}
                </div>




                {/* Warehouse Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('warehouse')}
                    className={`${
                      pathname.includes('/warehouse') ? 'bg-black' : ''
                    } text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 flex items-center`}
                  >
                    Warehouse
                    <FaChevronDown className={`ml-1 transition-transform ${openDropdown === 'warehouse' ? 'rotate-180' : ''}`} size={12} />
                  </button>
                  
                  {openDropdown === 'warehouse' && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <Link
                          href='/warehouse/location'
                          className={`${
                            pathname === '/warehouse/location' ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          Location
                        </Link>
                        <Link
                          href='/warehouse/location/assign'
                          className={`${
                            pathname === '/warehouse/locationassign' ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          Assign Location
                        </Link>
                        <Link
                          href='/warehouse/product/'
                          className={`${
                            pathname === '/warehouse/product/' ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          Product
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('user')}
                    className={`text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 flex items-center`}
                  >
                    Account
                    <FaChevronDown className={`ml-1 transition-transform ${openDropdown === 'user' ? 'rotate-180' : ''}`} size={12} />
                  </button>
                  
                  {openDropdown === 'user' && (
                    <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            login();
                            setOpenDropdown(null);
                          }}
                        >
                          Sign in
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            logout();
                            setOpenDropdown(null);
                          }}
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
export default Navbar