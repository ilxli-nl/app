
import { Suspense } from 'react'
import { OrderBol,OrderImg } from "../actions/actions";
import Imagebol from  '../components/image';


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
              </Suspense>
            </div>
          ))}
          </div>
        );
}

export default Order;


