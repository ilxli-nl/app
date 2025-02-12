"use client"

import { useQuery } from '@tanstack/react-query';
import { Token } from '../actions/actions';

const fetchOrders = async () => {
  const token = await Token();
  console.log(token)
  const res = await fetch(
    `${process.env.BOLAPI}retailer/orders`, //?page=${page}
    {
      // cache: 'force-cache',
      // next: {
      //   revalidate: 9000,
      // },
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );

  const resp = await res.json()
  
  //console.log(resp)
  return resp;
};
const InfiniteOrders = () => {
  const {data, isLoading, isError} = useQuery({ queryKey: ['Orderz'], queryFn: fetchOrders });

  console.log(data);


  return (
    <div>
      <h1>InfiniteOrders</h1>
    </div>
  );
};
export default InfiniteOrders;