'use client'
import { Suspense, React } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import ImgDone from './img_done'

const OrderDone = ({ data }) => {
  const formatter = new Intl.DateTimeFormat("nl-NL")
  return (
    <div key={data.orderId}>
      <div>
        <Card key={data.orderId} className='bg-zinc-50'>
          <CardHeader>
            <CardTitle className='flex justify-between'>
              <div>
                <h1 className='text-2xl'>{data.orderId}</h1>
              </div>
              <div>
                <h2 className='text-5xl'>{data.account}</h2>
              </div>
            </CardTitle>
          </CardHeader>
          {

              <Suspense fallback={<p>Loading feed...</p>}>
                <CardContent
                  className={
                    data.quantity >= 2 ? 'border-8 border-red-700 pt-5' : ''
                  }
                >
                  <div className='flex items-center'>
                    <figure
                      className={` ${
                        data.method == 'BOL' ? 'bg-sky-500' : 'bg-orange-500'
                      }  p-3 rounded-md`}
                    >
                           <Suspense fallback={<p>Loading feed...</p>}>
                      <ImgDone url={data.img} />
                      </Suspense>
                      <figcaption
                        className={`mt-2 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
                          data.latestDeliveryDate ?? `bg-red-400 rounded-md`
                        }`}
                      >
                        {data.exactDeliveryDate
                          ? `Exact: ${formatter.format(data.exactDeliveryDate)}`
                          : `${formatter.format(data.latestDeliveryDate)}`}
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
                            <p className='text-blue-500'>EAN {data.ean}</p>
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
                          {data.s_firstName} {data.s_surname}
                        </h1>
                        <p>
                          {data.s_streetName} {data.s_houseNumber}{' '}
                          {data.s_houseNumberExtension}
                        </p>
                        <p>
                          {data.s_zipCode} {data.s_city}{' '}
                          {data.s_houseNumberExtension}
                        </p>
                        {data.method}
                      </CardDescription>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>

                </CardFooter>
                </Suspense>
          }
        </Card>
      </div>
    </div>
  )
}
export default OrderDone
