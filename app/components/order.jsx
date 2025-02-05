import { Suspense, React } from 'react'
import { OrderBol } from '../actions/actions'
import Imagebol from '../components/image'
import Link from 'next/link'
import LabelButtonQLS from '../components/QLS_button'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function Order({ ordId }) {
  const odr = await OrderBol(ordId)

  const odrItm = await odr.orderItems

  //console.log(JSON.stringify(odr, null, '  '))

  return (
    <div key={odr.orderId}>
      <div>
        <Card key={odr.orderId}>
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
          <Suspense key={odr.orderId} fallback={<p>Loading feed...</p>}>
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
                      <Imagebol className='h-auto' ean={item.product.ean} />
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
                            <p>EAN {item.product.ean}</p>
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
                          {odr.shipmentDetails.zipCode}{' '}
                          {odr.shipmentDetails.city}{' '}
                          {odr.shipmentDetails.houseNumberExtension}
                        </p>
                      </CardDescription>
                    </div>
                  </div>
                </CardContent>
              </>
            ))}
          </Suspense>
          <CardFooter>
            <LabelButtonQLS  odr={odr} />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Order
