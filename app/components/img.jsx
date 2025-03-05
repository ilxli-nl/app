"use client"
import { Suspense, React } from 'react'
import { useQuery } from '@tanstack/react-query';
import { OrderImg } from '../actions/actions';
import Image from 'next/image'


const Img = ({ean})  => {
  const getImg =  ()=>{
    return  OrderImg(ean)
  }
  const {isPending, error, data, isFetching} = useQuery({ queryKey: [`image${ean}`], queryFn: getImg });
    if (isPending || isFetching) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message
  //console.log(data);
  return (
    <Suspense>
          <Image
            styles='height:auto; object-center'
            src={data}
            width={400}
            height={400}
            alt='Picture of the author'
            style={{ width: '400', height: 'auto' }}
          />
          </Suspense>
  );
};
export default Img;