'use client'
import { Suspense, useState } from 'react'
//import { Loader2 } from "lucide-react"
import { LabelQLS } from '../actions/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import LoadingSpinner from './loadingSpinner'

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function LabelButtonQLS({ odr }) {
  const [response, setResponse] = useState('')




  async function handeler(FormData) {
   
    odr.QLSproductId = FormData.get("QLSproductId")
    odr.QLScombination = FormData.get("QLScombination")
    //LabelQLS(id)
    //console.log(product_id)
 const id = await LabelQLS(odr)

    console.log(odr)
    setResponse(id)
  }

  function openLabel(response) {
    window.open(response, 'mysite', 'width=500,height=700', 'toolbar=no')
  }

  //

  return (
    <div className='flex space-x-4'>
      <form action={handeler}>

      <input type="hidden" id="postId" name="QLSproductId" value="99999" />
      <input type="hidden" id="postId" name="QLScombination" value="888888" />
      <Button type="submit">
        Create Label DHL BP
        {/* <Loader2 className="animate-spin" />disabled response */}
      </Button>
      </form>


      <form action={handeler}>

<input type="hidden" id="postId" name="QLSproductId" value="3333" />
<input type="hidden" id="postId" name="QLScombination" value="11111" />
<Button type="submit">
  Create Label DHL Pakje
  {/* <Loader2 className="animate-spin" />disabled response */}
</Button>
</form>
   
      <Suspense fallback={<LoadingSpinner />}>
        {response ? (
          <Button onClick={() => openLabel(response)}> Print </Button>
        ) : (
          ''
        )}
      </Suspense>
    </div>
  )
}

export default LabelButtonQLS
