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

const Order = ({ id, account }) => {
  const formatter = new Intl.DateTimeFormat('nl-NL')
  function isValidDate(d) {
    const date = new Date(d)
    return d && !isNaN(date)
  }

  const { isPending, isError, data, isFetching } = useQuery({
    queryKey: [`Order${id}`],
    queryFn: ({}) => OrderBol(id, account),
  })

  if (isPending) return 'Loading...'
  if (isError)
    return 'An error has occurred: ' + isError.message + ' -> ' + account
  if (isError) return 'No Ordders!'


  console.log(data)

  return (
    <div key={data.orderId}>
      <div>
        <Card key='`i-${id}}`' className='bg-zinc-50'>
          <CardHeader>
            <CardTitle className='flex justify-between'>
              <div>
                <h1 className='text-2xl'>{data[0]?.orderId}</h1>
              </div>
              <div>
                <h2 className='text-5xl'>{account}</h2>
              </div>
            </CardTitle>
          </CardHeader>
          {
            // data?.map((odr) => (
            (Array.isArray(data) ? data : []).map((odr) => (
              <>
                <Suspense fallback={<p>Loading feed...</p>}>
                  <CardContent
                    className={
                      odr.quantity >= 2 ? 'border-8 border-red-700 pt-5' : ''
                    }
                  >
                    <div className='flex items-center'>
                      <figure
                        className={` ${
                          odr.method == 'BOL' ? 'bg-sky-500' : 'bg-orange-500'
                        }  p-3 rounded-md`}
                      >
                        <Suspense fallback={<p>Loading feed...</p>}>
                          <Img ean={odr.ean} />
                        </Suspense>

                        <figcaption
                          className={`mt-2 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
                            odr.latestDeliveryDate ?? `bg-red-400 rounded-md`
                          }`}
                        >
                          {data.exactDeliveryDate
                            ? `Exact: ${odr.exactDeliveryDate}`
                            : isValidDate(odr.latestDeliveryDate)
                            ? `${formatter.format(
                                new Date(odr.latestDeliveryDate)
                              )}`
                            : 'Invalid date'}
                        </figcaption>
                      </figure>

                      <div className='w-2/3'>
                        <CardTitle className='flex items-center'>
                          <h1 className='w-4/5 p-5'>
                            {odr.title} <br />
                            <br />
                            <Link
                              href={`https://www.bol.com/nl/nl/s/?searchtext=${odr.ean}`}
                              target='_blank'
                            >
                              <p className='text-blue-500'>EAN {odr.ean}</p>
                            </Link>
                          </h1>
                          <h1
                            className={` ${
                              odr.quantity >= 2
                                ? 'bg-red-500'
                                : 'bg-sky-500/100'
                            }  p-3 text-9xl w-1/5 p-5  text-center rounded-md`}
                          >
                            {odr.quantity}
                          </h1>
                        </CardTitle>
                        <CardDescription>
                          <h1>
                            {odr.s_firstName} {odr.s_surname}
                          </h1>
                          <p>
                            {odr.s_streetName} {odr.s_houseNumber}{' '}
                            {odr.s_houseNumberExtension}
                          </p>
                          <p>
                            {odr.s_zipCode} {odr.s_city}{' '}
                          </p>
                          {odr.method}
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    {odr.distributionParty == 'BOL' ? (
                      ''
                    ) : (
                      <LabelButtonQLS odr={odr} />
                    )}
                  </CardFooter>
                </Suspense>
              </>
            ))
          }
        </Card>
      </div>
    </div>
  )
}
export default Order
