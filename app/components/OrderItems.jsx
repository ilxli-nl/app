import { Suspense } from 'react';

export default async function OrderItems({items , orderId}) {

//console.log(orderId)

const itemz = items.orderItems
  return (
    <div key={orderId}>
          {itemz.map((item) => (

              <Suspense fallback={<p>Loading feed...</p>}>
                <p>{item.ean}</p>
              </Suspense>

          ))}

    </div>
  );
}