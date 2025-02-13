"use client"

import { useQuery } from '@tanstack/react-query';
import { Orders } from '../actions/actions';

const InfiniteOrders = () => {
  const {isPending, error, data, isFetching} = useQuery({ queryKey: ['Orderz'], queryFn: Orders });
    if (isPending) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

  console.log(data);


  return (
    <div>
      <h1>InfiniteOrders</h1>
    </div>
  );
};
export default InfiniteOrders;