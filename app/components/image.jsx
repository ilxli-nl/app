import { Suspense } from 'react'
import { OrderImg } from '../actions/actions'
import Image from 'next/image'

//async function ImageBol({ean}) {
async function Imagebol({ ean }) {
  const imgs = await OrderImg(ean)
  //await sleep(2000);
  console.log(imgs)
  return (
    <Suspense fallback={<p>Loading feed...</p>}>
      <Image src={imgs} width={250} height={250} alt='Picture of the author' />
    </Suspense>
  )
}

export default Imagebol
