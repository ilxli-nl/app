'use client'
import { Suspense, React } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OrderBol } from '../actions/actions'
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

const Order = ({ id }) => {
  const getOrder = () => {
    return OrderBol(id)
  }
  const myRnId = () => parseInt(Date.now() * Math.random())

  const key = myRnId()

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: [`Order${id}`],
    queryFn: getOrder,
  })
  if (isPending) return 'Loading...'
  if (error) return 'An error has occurred: ' + error.message
  const odr = data
  const odrItm = data.orderItems

  console.log(key)

  return (
    <div key={odr.orderId}>
      <div>
        <Card key={id} className='bg-zinc-50'>
          <CardHeader>
            <CardTitle className='flex justify-between'>
              <div>
                <h1 className='text-2xl'>{odr.orderId}</h1>
              </div>
              <div>
                <h2 className='text-5xl'>NL</h2>
              </div>
            </CardTitle>
          </CardHeader>
          {/* <Suspense key={odr.orderId} fallback={<p>Loading feed...</p>}> */}
          {odrItm?.map((item) => (
            <>
              <CardContent
                className={
                  item.quantity >= 2 ? 'border-8 border-red-700 pt-5' : ''
                }
              >
                <div className='flex items-center'>
                  <figure
                    className={` ${
                      item.fulfilment.distributionParty == 'BOL'
                        ? 'bg-sky-500'
                        : 'bg-orange-500'
                    }  p-3 rounded-md`}
                  >
                    <Img ean={item.product.ean} />

                    <figcaption
                      className={`mt-2 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
                        item.fulfilment.latestDeliveryDate ??
                        `bg-red-400 rounded-md`
                      }`}
                    >
                      {item.fulfilment.exactDeliveryDate
                        ? `Exact: ${item.fulfilment.exactDeliveryDate}`
                        : item.fulfilment.latestDeliveryDate}
                    </figcaption>
                  </figure>

                  <div className='w-2/3'>
                    <CardTitle className='flex items-center'>
                      <h1 className='w-4/5 p-5'>
                        {item.product.title} <br />
                        <br />
                        <Link
                          href={`https://www.bol.com/nl/nl/s/?searchtext=${item.product.ean}`}
                          target='_blank'
                        >
                          <p className='text-blue-500'>
                            EAN {item.product.ean}
                          </p>
                        </Link>
                      </h1>
                      <h1
                        className={` ${
                          item.quantity >= 2 ? 'bg-red-500' : 'bg-sky-500/100'
                        }  p-3 text-9xl w-1/5 p-5  text-center rounded-md`}
                      >
                        {item.quantity}
                      </h1>
                    </CardTitle>
                    <CardDescription>
                      <h1>
                        {odr.shipmentDetails.firstName}{' '}
                        {odr.shipmentDetails.surname}
                      </h1>
                      <p>
                        {odr.shipmentDetails.streetName}{' '}
                        {odr.shipmentDetails.houseNumber}{' '}
                        {odr.shipmentDetails.houseNumberExtension}
                      </p>
                      <p>
                        {odr.shipmentDetails.zipCode} {odr.shipmentDetails.city}{' '}
                        {odr.shipmentDetails.houseNumberExtension}
                      </p>
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </>
          ))}

          <CardFooter>
            {odrItm[0]?.fulfilment.distributionParty == 'BOL' ? (
              ''
            ) : (
              <LabelButtonQLS odr={odr} />
            )}
          </CardFooter>
          {/* </Suspense> */}
        </Card>
      </div>
    </div>
  )
}
export default Order
