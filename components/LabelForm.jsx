'use client';
import { useState } from 'react';
import { createBpostLabel } from '../app/actions/bpost';

export default function LabelForm({data}) {
  const [state, setState] = useState(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData) {
    setIsPending(true);
    try {
      const result = await createBpostLabel(formData);
      setState(result);
      console.log(result)
    } catch (error) {
      setState({ error: error.message });
    } finally {
      setIsPending(false);
    }
  }
  console.log(data)
  return (

  
    <form action={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {<input type="hidden" id="name" value={`${data.s_firstName} ${data.s_surname}`} name="name" />}
      {<input type="hidden" id="name" value={data.s_streetName} name="streetName" />}
      {<input type="hidden" id="name" value={data.s_houseNumber} name="number" />}
      {<input type="hidden" id="name" value={data.s_city} name="locality" />}
      {<input type="hidden" id="name" value={data.s_zipCode} name="postalCode" />}
      {<input type="hidden" id="name" value={data.account} name="countryCode" />}
      {<input type="hidden" id="name" value={data.phoneNumber} name="phoneNumber" />}
      {<input type="hidden" id="name" value={data.email} name="email" />}
      {<input type="hidden" id="name" value={`test-${data.orderId}`} name="orderReference" />}

    <div className='mydict'>
      <div>
        <label>
      <input type="radio" id="shipping_BP" name="shipping" value="BP" />
      <span>BP</span>
</label>
<label>
      <input type="radio" id="shipping_PRO" name="shipping" value="PRO_24" />
      <span>Pro 24</span></label>


      <label>
<button type="submit" disabled={isPending}> <span>
        {isPending ? 'Submitting...' : 'Submit'}
      </span></button>
</label>
      </div>

    </div>
    
    </form>
  );
}