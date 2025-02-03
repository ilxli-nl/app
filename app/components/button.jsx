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

function LabelButton() {
  const [response, setResponse] = useState('')

  const rndInt =
    randomIntFromInterval(1, 6) *
    randomIntFromInterval(3, 9) *
    randomIntFromInterval(3, 9)

  async function handeler() {
    const id = await LabelQLS()
    //LabelQLS(id)
    console.log(id)
    setResponse(id)
  }

  //

  return (
    <>
      <Button onClick={() => handeler()}>
        {' '}
        Create Label
        {/* <Loader2 className="animate-spin" />disabled response */}
      </Button>
      <Suspense fallback={<LoadingSpinner />}>
        {response ? (
          <button>
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href={response}
              target='_blank'
            >
              Label
            </Link>
          </button>
        ) : (
          ''
        )}
      </Suspense>
    </>
  )
}

export default LabelButton
