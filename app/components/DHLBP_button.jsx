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

function LabelButtonDHLBP({ odr }) {
  const [response, setResponse] = useState('')

  async function handeler(odr) {
    const id = await LabelQLS(odr)
    //LabelQLS(id)
    //console.log(product_id)
    //console.log(combination)
    setResponse(id)
  }

  function openLabel(response) {
    window.open(response, 'mysite', 'width=500,height=700', 'toolbar=no')
  }

  //

  return (
    <div className='flex space-x-4'>
      <Button onClick={() => handeler(odr)}>
        Create Label DHL Pakje
        {/* <Loader2 className="animate-spin" />disabled response */}
      </Button>{' '}
      {'  '}
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

export default LabelButtonDHLBP
