"use client"
import { useQuery } from '@tanstack/react-query';
import { OrderImg } from '../app/actions/actions';
import Image from 'next/image'


const Img = ({ean, account})  => {

  const {isPending, error, data, isFetching} = useQuery({ queryKey: [`image${ean}`], queryFn: () => OrderImg(ean, account)});
    if (isPending || isFetching) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message
   
  return (

          <Image
            styles='height:auto; object-center'
            src={data}
            width={400}
            height={400}
            alt='Picture of the author'
            style={{ width: '400', height: 'auto' }}
          />

  );
};
export default Img;