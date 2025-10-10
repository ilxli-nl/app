'use client'
import { ComboOrders } from '../app/actions/actions';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react'
import Img from './img'
import LabelButtonQLS from './QLS_button'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Utility functions
const formatter = new Intl.DateTimeFormat('nl-NL')

const isValidDate = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

const formatDate = (dateString) => {
  if (!isValidDate(dateString)) return 'Invalid date'
  return formatter.format(new Date(dateString))
}

// Loading component
const LoadingState = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    <span className="ml-3">Loading orders...</span>
  </div>
)

// Error component
const ErrorState = ({ error }) => (
  <div className="text-center p-8 text-red-600">
    <p>No orders found!</p>
    {error && <p className="text-sm mt-2">{error.message}</p>}
  </div>
)

// Order Item Component
const OrderItem = ({ odr }) => {
  const deliveryDate = odr.exactDeliveryDate 
    ? `Exact: ${formatDate(odr.exactDeliveryDate)}`
    : formatDate(odr.latestDeliveryDate)

  const quantityClass = odr.quantity >= 2 
    ? 'bg-red-500' 
    : 'bg-sky-500/100'

  const methodClass = odr.method === 'BOL' 
    ? 'bg-sky-500' 
    : 'bg-orange-500'

  const showLabelButton = odr.distributionParty !== 'BOL'

  return (
    <Suspense fallback={<p>Loading item...</p>}>
      <CardContent className={odr.quantity >= 2 ? 'border-4 border-red-700 pt-5' : ''}>
        <div className='flex flex-col w-full md:flex-row'>
          <figure className={`${methodClass} p-2 rounded-md`}>
            <Suspense fallback={<p>Loading image...</p>}>
              <Img ean={odr.ean} account={odr.account} />
            </Suspense>
            <figcaption className={`mt-2 p-4 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
              !odr.latestDeliveryDate ? 'bg-red-600 rounded-md' : ''
            }`}>
              {deliveryDate}
            </figcaption>
          </figure>

          <div className='w-full'>
            <CardTitle className='flex items-center'>
              <div className='w-4/5 p-5'>
                <h1 className="text-lg font-semibold mb-2">{odr.title}</h1>
                <Link 
                  href={`https://www.bol.com/nl/nl/s/?searchtext=${odr.ean}`}
                  target='_blank'
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                >
                  EAN {odr.ean}
                </Link>
              </div>
              <div className={`${quantityClass} p-3 text-6xl md:text-9xl w-1/5 text-center rounded-md`}>
                {odr.quantity}
              </div>
            </CardTitle>
            <CardDescription>
              <div className="space-y-1">
                <h1 className="font-medium">
                  {odr.s_firstName} {odr.s_surname}
                </h1>
                <p>
                  {odr.s_streetName} {odr.s_houseNumber} {odr.s_houseNumberExtension || ''}
                </p>
                <p>
                  {odr.s_zipCode} {odr.s_city}
                </p>
                <p className="text-sm text-gray-500">{odr.method}</p>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {showLabelButton && <LabelButtonQLS odr={odr} />}
      </CardFooter>
    </Suspense>
  )
}

// Order Card Component
const OrderCard = ({ order }) => {
  const orderDetails = Array.isArray(order.details) ? order.details : []

  return (
    <Card key={order.orderId} className='overflow-hidden rounded-xl bg-white shadow-md max-w-full mb-6'>
      <CardHeader>
        <CardTitle className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>{order.orderId}</h1>
          <h2 className='text-3xl md:text-5xl font-semibold'>{order.details?.[0]?.account || 'NL'}</h2>
        </CardTitle>
      </CardHeader>

      {orderDetails.map((odr, index) => (
        <OrderItem key={`${odr.orderItemId}-${index}`} odr={odr} />
      ))}
    </Card>
  )
}

// Main Component
// In your AllOrders.jsx - update the error handling
const AllOrders = ({ page, account }) => {
  const { 
    isPending, 
    error, 
    data, 
    isFetching 
  } = useQuery({
    queryKey: ['Orders', page, account],
    queryFn: () => ComboOrders(page, account),
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Loading state
  if (isPending || isFetching) {
    return <LoadingState />
  }

  // Error state - more specific handling
  if (error) {
    const errorMessage = error.message.includes('Failed to fetch orders') 
      ? 'No orders found or API temporarily unavailable'
      : error.message;
    
    return <ErrorState error={{ message: errorMessage }} />
  }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No orders found for this page.</p>
        <p className="text-sm mt-2">Try a different page or check back later.</p>
      </div>
    );
  }

  return (
    <div className='md:m-5 lg:m-20'>
      <ul className="space-y-6">
        {data.map((order) => (
          <li key={order.orderId}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AllOrders