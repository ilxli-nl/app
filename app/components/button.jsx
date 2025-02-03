'use client'
import { useState } from "react";
//import { Loader2 } from "lucide-react"
import { LabelQLS } from '../actions/actions'
import { Button } from "@/components/ui/button"




function LabelButton (){


  function handeler(){

const id = 12343212
   LabelQLS(id)
}


 // const [response, setResponse] = useState("");


//setResponse(res)

  return (
    <Button onClick={ () =>handeler()}>
tewst
      {/* <Loader2 className="animate-spin" />disabled response */}
 {}
    </Button>
)
}

export default LabelButton