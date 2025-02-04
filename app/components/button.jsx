'use client'
import { Suspense, useState } from 'react'
//import { Loader2 } from "lucide-react"
import { LabelQLS } from '../actions/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import LoadingSpinner from '../components/loadingSpinner'

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function LabelButton(odr) {
  const [response, setResponse] = useState('')

  const rndInt =
    randomIntFromInterval(1, 6) *
    randomIntFromInterval(3, 9) *
    randomIntFromInterval(3, 9)

  async function handeler(odr) {
    const id = await LabelQLS(odr)
    //LabelQLS(id)
    //console.log(odr)
    setResponse(id)
  }

  function openLabel(url) {
    window.open(url, 'mysite', 'width=500,height=700', 'toolbar=no')
  }

  //

  return (
    <div className='flex space-x-4'>
      <Button onClick={() => handeler(...odr, 555)}>
        Create Label
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

export default LabelButton
