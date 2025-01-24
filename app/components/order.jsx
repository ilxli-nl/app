
import { Suspense } from 'react'
import { OrderBol,OrderImg } from "../actions/actions";
import Imagebol from  '../components/image';



async function Order({ordId}) {
  const odr = await OrderBol(ordId);


   // const img = odr.orderItems[0].product.ean ?? odr.orderItems.product[0].ean
    
//console.log(OrderImg(8720279182420))
        return (
            <div>
                <Suspense fallback={<p>Loading feed...</p>}>
                <h1>test: {odr.orderId}</h1>
                {/* <Imagebol ean={img} /> */}
</Suspense>
            </div>
        );
}

export default Order;


