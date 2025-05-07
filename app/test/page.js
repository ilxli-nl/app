'use client';
import { ShippingLabelForm } from '@/components/ShippingLabelForm';
import { Suspense, React } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Orders } from '@/app/actions/actions';

export default function ShippingPage() {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ['Orders', 1],
    queryFn: () => Orders(1, 'BE'),
  });
  if (isPending || isFetching) return 'Loading...';
  //if (error) return 'An error has occurred: ' + error.message
  if (error) return 'No Ordders!';
  // Sample orders data
  // const orders = [
  //   {
  //     id: 'ORD-12345',
  //     name: 'John Doe',
  //     streetName: 'Main St',
  //     number: 12,
  //     Locality: 'New York',
  //     PostalCode: '10001',
  //     CountryCode: 'USA',
  //     PhoneNumber: '1231321321321',
  //     Email: 'ashdsd@kjshfdsf.nl',
  //     OrderReference: 'uwqeriuyeiuryeiuwr',
  //     Shipping: 'BE',
  //   },
  //   {
  //     id: 'ORD-45646',
  //     name: 'Djhgf Uhgbhsdf',
  //     streetName: 'Main St',
  //     number: 18,
  //     Locality: 'New York',
  //     PostalCode: '10001',
  //     CountryCode: 'USA',
  //     PhoneNumber: '1231321321321',
  //     Email: 'ashdsd@kjshfdsfty.nl',
  //     OrderReference: 'BBBBBBB',
  //     Shipping: 'BE',
  //   },
  //   {
  //     id: 'ORD-9999',
  //     name: 'Jhuyhf Hyet',
  //     streetName: 'Main St',
  //     number: 166,
  //     Locality: 'New York',
  //     PostalCode: '10001',
  //     CountryCode: 'USA',
  //     PhoneNumber: '1231321321321',
  //     Email: 'ashdsd@kjshfdsf.nl',
  //     OrderReference: 'CCCCCCC',
  //     Shipping: 'BE',
  //   },
  // ];

  // Name: formData.get('name'),
  // StreetName: formData.get('streetName') || '',
  // Number: Number(formData.get('number')) || '',
  // Locality: formData.get('locality') || '',
  // PostalCode: Number(formData.get('postalCode')) || '',
  // CountryCode: formData.get('countryCode') || 'BE',
  // PhoneNumber: formData.get('phoneNumber') || '+32 0 000 00 00',
  // Email: formData.get('email') || '',
  // OrderReference: formData.get('orderReference') || '',
  // Shipping: formData.get('shipping') || '',

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6'>Shipping Labels</h1>
      <ShippingLabelForm orders={data} />
    </div>
  );
}

// // app/search/page.js
// import { auth } from '@/auth';

// export default async function SearchPage({ searchParams }) {
//   const session = await auth();

//   if (session?.user.name == 'ilxli-nl') {
//     return (
//       <div className='items-center justify-items-center'>
//         <h1 className='text-2xl font-bold mb-4'>Order Search</h1>
//       </div>
//     );
//   }
// }
