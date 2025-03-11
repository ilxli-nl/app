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

  

  // const myRnId = () => parseInt(Date.now() * Math.random())

  // const key = myRnId()

  const { isPending, isError, data, isFetching } = useQuery({
    queryKey: [`Order${id}`],
    queryFn: ({})=> OrderBol(id),
  })

  
  if (isPending) return 'Loading...'
  if (isError) return 'An error has occurred: ' + isError.message
  // if (isError) return 'No Ordders!'

console.log(data)
  const odr = data
  const odrItm = data.orderItems

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
          {/* <Suspense key={odr.orderId} fallback={<p>Loading feed...</p>}> {data?.map((item) => ( */}
         
            <>
              <CardContent
                className={
                  data.quantity >= 2 ? 'border-8 border-red-700 pt-5' : ''
                }
              >
                <div className='flex items-center'>
                  <figure
                    className={` ${
                      data.method == 'BOL'
                        ? 'bg-sky-500'
                        : 'bg-orange-500'
                    }  p-3 rounded-md`}
                  >
                  
                    <Img ean={data.ean} />

                    <figcaption
                      className={`mt-2 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
                        data.latestDeliveryDate ??
                        `bg-red-400 rounded-md`
                      }`}
                    >
                      {data.exactDeliveryDate
                        ? `Exact: ${data.exactDeliveryDate}`
                        : data.latestDeliveryDate}
                    </figcaption>
                  </figure>

                  <div className='w-2/3'>
                    <CardTitle className='flex items-center'>
                      <h1 className='w-4/5 p-5'>
                        {data.title} <br />
                        <br />
                        <Link
                          href={`https://www.bol.com/nl/nl/s/?searchtext=${data.ean}`}
                          target='_blank'
                        >
                          <p className='text-blue-500'>
                            EAN {data.ean}
                          </p>
                        </Link>
                      </h1>
                      <h1
                        className={` ${
                          data.quantity >= 2 ? 'bg-red-500' : 'bg-sky-500/100'
                        }  p-3 text-9xl w-1/5 p-5  text-center rounded-md`}
                      >
                        {data.quantity}
                      </h1>
                    </CardTitle>
                    <CardDescription>
                      <h1>
                        {data.s_firstName}{' '}
                        {data.s_surname}
                      </h1>
                      <p>
                        {data.s_streetName}{' '}
                        {data.s_houseNumber}{' '}
                        {data.s_houseNumberExtension}
                      </p>
                      <p>
                        {data.s_zipCode} {data.s_city}{' '}
                        {data.s_houseNumberExtension}
                      </p>
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </>
          {/* ))} */}

          <CardFooter>
            {odrItm?.fulfilment.distributionParty == 'BOL' ? (
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
