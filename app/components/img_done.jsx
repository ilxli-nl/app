"use client"
import Image from 'next/image'
const ImgDone = ({url})  => {
  return (

          <Image
            styles='height:auto; object-center'
            src={url}
            width={400}
            height={400}
            alt='Picture of the author'
            style={{ width: '400', height: 'auto' }}
          />
  );
};
export default ImgDone;