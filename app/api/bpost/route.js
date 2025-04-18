// export async function POST(req) {
//   const body = await req.json();

//   const response = await fetch('https://api-parcel.bpost.be/services/shm/', {
//     method: 'post',
//     headers: {
//       'Content-Type': 'application/json',
//       Accept: 'application/json',
//       Authorization:
//         'Basic ' +
//         Buffer.from('033209:ioNigHtWiTatOrTHRemE').toString('base64'),
//     },
//     body: JSON.stringify(body),
//   });

//   console.log(response);
//   const data = await response.json();

//   return Response.json(data);
// }

// app/api/bpost/route.js

import { NextResponse } from 'next/server';
import { createBpostOrder } from '../../../bpostClient';

export async function POST(req) {
  try {
    const orderData = await req.json();
    const result = await createBpostOrder(orderData);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
