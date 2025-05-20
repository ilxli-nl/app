'use client'
import { Suspense, React } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OrderBol } from '../app/actions/actions'
import Img from './img'
import { useForm, useStore } from "@tanstack/react-form";
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import submitForm from "@/app/actions/actions";
import { useState } from "react";
const OrderBE = ({ id, account, index }) => {

    const [response, setResponse] = useState(null);
    
  
  
  

      const form = useForm({
        defaultValues: {
          fullname: "",
          email: "",
          password: "",
          confirmPassword: "",
        },
        validators: {
          onChange: ({ value }) => {
            if (!/\S+@\S+\.\S+/.test(value.email)) {
              return "Email address not valid";
            }
          },
        },
        onSubmit: async ({ value }) => {
              e.preventDefault();
          //Do somethig here
          console.log("Form Values are : ", value);
    
          const result = await submitForm(value);
          setResponse(result.message);
    
          if (result.success) {
    
            
            form.reset();
          }
        },
      });
  
  const formErrorMap = useStore(form.store, (state) => state.errorMap);


  const formatter = new Intl.DateTimeFormat('nl-NL')
  function isValidDate(d) {
    const date = new Date(d)
    return d && !isNaN(date)
  }

  const { isPending, isError, data, isFetching } = useQuery({
    queryKey: [`Order${id}`],
    queryFn: ({}) => OrderBol(id, account),
  })

  if (isPending) return 'Loading...'
  if (isError)
    return 'An error has occurred: ' + isError.message + ' -> ' + account
  if (isError) return 'No Ordders!'

  return (
<>




    <div>
      <h2>Next.js + Tanstack Form</h2>

        <form.Field
          name="fullname"
          validators={{
            onChange: ({ value }) =>
              !value
                ? "Fullname is required"
                : value.length < 3
                ? "Fullname must be at least 3 characters"
                : undefined,
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Fullname</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <em role="alert">{field.state.meta.errors}</em>
              ) : null}
            </div>
          )}
        />
        <form.Field name="email">
          {(field) => (
            <div>
              <label htmlFor={field.name}>Email</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {formErrorMap.onChange ? (
                <em role="alert">{formErrorMap.onChange}</em>
              ) : null}
            </div>
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <div>
              <label htmlFor={field.name}>Password</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ["password"],
            onChange: ({ value, fieldApi }) => {
              if (value !== fieldApi.form.getFieldValue("password")) {
                return "Passwords do not match";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name}>Confirm Pass</label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <em role="alert">{field.state.meta.errors}</em>
              ) : null}
            </div>
          )}
        </form.Field>
        <button type="submit">Submit</button>
        {response && <p>{response}</p>}
    
    </div>








    <div key={data.orderId}>
      <div>
        <Card key={`order-${data?.orderId}`} className='bg-zinc-50'>
          <CardHeader>
            <CardTitle className='flex justify-between'>
              <div>
                <h1 className='text-2xl'>{data[0]?.orderId}</h1>
              </div>
              <div>
                <h2 className='text-5xl'>{account}</h2>
              </div>
            </CardTitle>
          </CardHeader>
     
           
          {
            // data?.map((odr) => (

              
            (Array.isArray(data) ? data : []).map((odr) => (
              <>
                <Suspense fallback={<p>Loading feed...</p>}>
                  <CardContent
                    className={
                      odr.quantity >= 2 ? 'border-8 border-red-700 pt-5' : ''
                    }
                  >
                    <div className='flex items-center'>
                      <figure
                        className={` ${
                          odr.method == 'BOL' ? 'bg-sky-500' : 'bg-orange-500'
                        }  p-3 rounded-md`}
                      >
                        <Suspense fallback={<p>Loading feed...</p>}>
                          <Img ean={odr.ean} />
                        </Suspense>

                        <figcaption
                          className={`mt-2 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
                            odr.latestDeliveryDate ?? `bg-red-400 rounded-md`
                          }`}
                        >
                          {data.exactDeliveryDate
                            ? `Exact: ${odr.exactDeliveryDate}`
                            : isValidDate(odr.latestDeliveryDate)
                            ? `${formatter.format(
                                new Date(odr.latestDeliveryDate)
                              )}`
                            : 'Invalid date'}
                        </figcaption>
                      </figure>

                      <div className='w-2/3'>
                        <CardTitle className='flex items-center'>
                          <h1 className='w-4/5 p-5'>
                            {odr.title} <br />
                            <br />
                            <Link
                              href={`https://www.bol.com/nl/nl/s/?searchtext=${odr.ean}`}
                              target='_blank'
                            >
                              <p className='text-blue-500'>EAN {odr.ean}</p>
                            </Link>
                          </h1>
                          <h1
                            className={` ${
                              odr.quantity >= 2
                                ? 'bg-red-500'
                                : 'bg-sky-500/100'
                            }  p-3 text-9xl w-1/5 p-5  text-center rounded-md`}
                          >
                            {odr.quantity}
                          </h1>
                        </CardTitle>
                        <CardDescription>
                          <h1>
                            {odr.s_firstName} {odr.s_surname}
                          </h1>
                          <p>
                            {odr.s_streetName} {odr.s_houseNumber}{' '}
                            {odr.s_houseNumberExtension}
                          </p>
                          <p>
                            {odr.s_zipCode} {odr.s_city}{' '}
                          </p>
                          {odr.method}
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                  
                     {/* <CheckBox orders={data} /> */}
               
                  </CardFooter>
                </Suspense>
              </>
            )
           
            
            )
          }

        </Card>
      </div>
    </div>
</>
  )

}
export default OrderBE
