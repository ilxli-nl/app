import { Suspense } from 'react'
import { OrderBol } from '../actions/actions'
import Imagebol from '../components/image'
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

  const odrItm = odr.orderItems
  console.log(JSON.stringify(odr, null, '  '))

  return (
    <div key={odr.orderId}>
      <div>
        <Suspense fallback={<p>Loading feed...</p>}>
          <Card>
            <CardHeader>
              <CardTitle>
                <h1 className='text-2xl'>{odr.orderId}</h1>
              </CardTitle>
            </CardHeader>
            {odrItm.map((item) => (
              <>
                <CardContent>
                  <div className='flex items-center'>
                    <div
                      className={`flex w-410  ${
                        item.fulfilment.distributionParty == 'BOL'
                          ? 'bg-sky-500'
                          : 'bg-orange-500'
                      }  p-3  item-center`}
                    >
                      <Imagebol ean={item.product.ean} />
                      <h2>{item.fulfilment.latestDeliveryDate}</h2>
                    </div>
                    <div>{item.fulfilment.latestDeliveryDate}</div>
                    <div className='w-2/3'>
                      <CardTitle className='flex items-center'>
                        <h1 className='w-4/5 p-5'>
                          {item.product.title} <br />
                          <br />
                          <p>EAN {item.product.ean}</p>
                        </h1>
                        <h1 className='text-9xl w-1/5 p-5 bg-sky-500/100 text-center'>
                          {item.quantity}
                        </h1>
                      </CardTitle>
                      <CardDescription>
                        <h1>test: {odr.shipmentDetails.firstName}</h1>
                      </CardDescription>
                    </div>
                  </div>
                </CardContent>
              </>
            ))}
            <CardFooter></CardFooter>
          </Card>
        </Suspense>
      </div>
    </div>
  )
}

export default Order
