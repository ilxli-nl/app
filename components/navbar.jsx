'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FaGoogle, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa'
import { useState, useRef, useEffect } from 'react'
import logo from '@/assets/images/logo-white.png'
import { login, logout } from '@/lib/actions/auth'

const Navbar = () => {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navbarRef = useRef(null)

  // Close menus when clicking outside navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setOpenDropdown(null)
        setMobileMenuOpen(false)
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => {
      if (prev) setOpenDropdown(null) // if closing → reset dropdowns
      return !prev
    })
  }

  // Function to close both mobile menu and dropdowns
  const closeAllMenus = () => {
    setMobileMenuOpen(false)
    setOpenDropdown(null)
  }

  return (
    <nav ref={navbarRef} className="bg-blue-700 border-b border-blue-500">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center justify-between">
          <div className="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
            {/* Logo */}
            <Link className="flex flex-shrink-0 items-center" href="/" onClick={closeAllMenus}>
              <Image className="h-10 w-auto" src={logo} alt="LitaLife" />
              <span className="hidden md:block text-white text-2xl font-bold ml-2">
                ilxli App
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:ml-6 md:block">
              <div className="flex space-x-2">
                <Link
                  href="/"
                  className={`${pathname === '/' ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  className={`${pathname === '/properties' ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                >
                  Search
                </Link>

                {/* Orders Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('orders')}
                    className={`${pathname.includes('/orders') ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 flex items-center`}
                  >
                    Orders
                    <FaChevronDown className={`ml-1 transition-transform ${openDropdown === 'orders' ? 'rotate-180' : ''}`} size={12} />
                  </button>

                  {openDropdown === 'orders' && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <Link href="/orders?page=1" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>
                          Orders NL
                        </Link>
                        <Link href="/orders_be?page=1" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>
                          Orders BE
                        </Link>
                        <Link href="/orders_new?page=1" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>
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
                    className={`${pathname.includes('/warehouse') ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 flex items-center`}
                  >
                    Warehouse
                    <FaChevronDown className={`ml-1 transition-transform ${openDropdown === 'warehouse' ? 'rotate-180' : ''}`} size={12} />
                  </button>

                  {openDropdown === 'warehouse' && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <Link href="/warehouse/location" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>
                          Location
                        </Link>
                        <Link href="/warehouse/location/assign" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>
                          Assign Location
                        </Link>
                        <Link href="/warehouse/product/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>
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
                    className="text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2 flex items-center"
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
                            login()
                            closeAllMenus()
                          }}
                        >
                          Sign in
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            logout()
                            closeAllMenus()
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

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              data-mobile-toggle
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {mobileMenuOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className={`${pathname === '/' ? 'bg-blue-800' : ''} text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600`} onClick={closeAllMenus}>
              Home
            </Link>
            <Link href="/search" className={`${pathname === '/properties' ? 'bg-blue-800' : ''} text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600`} onClick={closeAllMenus}>
              Search
            </Link>

            {/* Mobile Orders Dropdown */}
            <div>
              <button
                onClick={() => toggleDropdown('orders-mobile')}
                className={`${pathname.includes('/orders') ? 'bg-blue-800' : ''} text-white hover:bg-blue-600 w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center justify-between`}
              >
                <span>Orders</span>
                <FaChevronDown className={`transition-transform ${openDropdown === 'orders-mobile' ? 'rotate-180' : ''}`} size={12} />
              </button>
              {openDropdown === 'orders-mobile' && (
                <div className="pl-4 mt-2 space-y-2">
                  <Link href="/orders?page=1" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600" onClick={closeAllMenus}>
                    Orders NL
                  </Link>
                  <Link href="/orders_be?page=1" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600" onClick={closeAllMenus}>
                    Orders BE
                  </Link>
                  <Link href="/orders_new?page=1" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600" onClick={closeAllMenus}>
                    Orders NEW
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Warehouse Dropdown */}
            <div>
              <button
                onClick={() => toggleDropdown('warehouse-mobile')}
                className={`${pathname.includes('/warehouse') ? 'bg-blue-800' : ''} text-white hover:bg-blue-600 w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center justify-between`}
              >
                <span>Warehouse</span>
                <FaChevronDown className={`transition-transform ${openDropdown === 'warehouse-mobile' ? 'rotate-180' : ''}`} size={12} />
              </button>
              {openDropdown === 'warehouse-mobile' && (
                <div className="pl-4 mt-2 space-y-2">
                  <Link href="/warehouse/location" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600" onClick={closeAllMenus}>
                    Location
                  </Link>
                  <Link href="/warehouse/location/assign" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600" onClick={closeAllMenus}>
                    Assign Location
                  </Link>
                  <Link href="/warehouse/product/" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600" onClick={closeAllMenus}>
                    Product
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Auth */}
            <div className="pt-4 pb-3 border-t border-blue-500">
              <button
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                onClick={() => {
                  login()
                  closeAllMenus()
                }}
              >
                Sign in
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                onClick={() => {
                  logout()
                  closeAllMenus()
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
