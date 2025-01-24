import { Suspense } from 'react'
import { OrderImg } from "../actions/actions";



//async function ImageBol({ean}) {
async function Imagebol({ean}) {
   const imgs = await OrderImg(ean);
    //await sleep(2000);
console.log(imgs)
        return (
            <div>
        <Suspense fallback={<p>Loading feed...</p>}>
                <h1>Image: {imgs}</h1>
</Suspense>
            </div>
        );
}

export default Imagebol;