'use client'
import { Suspense, useState } from 'react'
//import { Loader2 } from "lucide-react"
import { LabelQLS } from '../actions/actions'
import { Button, buttonVariants } from '../../components/ui/button'
import Link from 'next/link'
import LoadingSpinner from './loadingSpinner'

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function LabelButtonQLS({ odr }) {
  const [response, setResponse] = useState('')




  async function handeler(FormData) {
    // $(form).prop('readonly', true);
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
    <div className='flex space-x-4 mt-5'>
      <form action={handeler}>

      <input type="hidden" id="postId" name="QLSproductId" value="1" />
      <input type="hidden" id="postId" name="QLScombination" value="1" />
      <Button type="submit" className='bg-sky-500'>
        Create Label DHL BP
        {/* <Loader2 className="animate-spin" />disabled response */}
      </Button>
      </form>


      <form action={handeler}>

      <input type="hidden" id="postId" name="QLSproductId" value="2" />
      <input type="hidden" id="postId" name="QLScombination" value="3" />
      <Button type="submit"  className='bg-orange-500'>
        Create Label DHL Pakje
        {/* <Loader2 className="animate-spin" />disabled response */}
      </Button>
      </form>

      <form action={handeler}>

      <input type="hidden" id="postId" name="QLSproductId" value="10" />
      <input type="hidden" id="postId" name="QLScombination" value="19" />
      <Button type="submit" className='bg-yellow-500'>
        Create Label DHL DHLFYEU
        {/* <Loader2 className="animate-spin" />disabled response */}
      </Button>
      </form>

      <form action={handeler}>

      <input type="hidden" id="postId" name="QLSproductId" value="9" />
      <input type="hidden" id="postId" name="QLScombination" value="18" />
      <Button type="submit"  className='bg-green-500'>
        Create Label DHL DHLFY
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
