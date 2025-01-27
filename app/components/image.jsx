import { Suspense } from 'react'
import { OrderImg } from '../actions/actions'
import Image from 'next/image'

async function Imagebol({ ean }) {
  const imgs = await OrderImg(ean)

  return (
    <Suspense fallback={<p>Loading feed...</p>}>
      <Image
        styles='height:auto; object-center'
        src={imgs}
        width={300}
        height={300}
        alt='Picture of the author'
      />
    </Suspense>
  )
}

export default Imagebol
