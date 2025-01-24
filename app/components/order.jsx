
import { Suspense } from 'react'
import { OrderBol,OrderImg } from "../actions/actions";
import Imagebol from  '../components/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


async function Order({ordId}) {
  const odr = await OrderBol(ordId);

  const odrItm = odr.orderItems


   // const img = odr.orderItems[0].product.ean ?? odr.orderItems.product[0].ean
    
//console.log(OrderImg(8720279182420))
        return (
          <div key={odr.orderId}>
          {odrItm.map((item) => (
            <div>
                <Suspense fallback={<p>Loading feed...</p>}>
                {/* <OrderItems items={item} orderId={item.orderId} /> */}
                <h1>test: {item.orderItemId}</h1>
                <h1>test: {item.product.ean}</h1>
                <Imagebol ean={item.product.ean} />
                <Card>
  <CardHeader>
    <CardTitle>{item.product.title}</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
              </Suspense>
            </div>
          ))}
          </div>
        );
}

export default Order;


