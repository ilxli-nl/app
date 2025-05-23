'use client'
import { ComboOrders } from '../app/actions/actions';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useCallback, useEffect } from 'react';
import Img from './img';
import LabelButtonQLS from './QLS_button';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast"
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formatter = new Intl.DateTimeFormat('nl-NL')
function isValidDate(d) {
  const date = new Date(d)
  return d && !isNaN(date)
}

// Updated FormSchema to include address information
const FormSchema = z.object({
  selectedItems: z.array(z.object({
    orderId: z.string(),
    ean: z.string(),
    address: z.object({
      firstName: z.string(),
      surname: z.string(),
      streetName: z.string(),
      houseNumber: z.string(),
      houseNumberExtension: z.string().optional(),
      zipCode: z.string(),
      city: z.string()
    })
  })).min(1, {
    message: "You must select at least one item.",
  }),
});

const AllOrders = ({ page, account }) => {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ['Orders', page],
    queryFn: () => ComboOrders(page, account),
  });

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedItems: [],
    },
    mode: 'onChange',
  });

  const selectedItems = useWatch({
    control: form.control,
    name: "selectedItems",
  });

  const { toast } = useToast()

  // Get all order IDs
  const allOrderIds = data?.map(order => order.orderId) || [];

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === allOrderIds.length) {
      form.setValue('selectedItems', []);
    } else {
      // Include address information when selecting all
      const allItemsWithAddress = data?.map(order => ({
        orderId: order.orderId,
        ean: order.details?.[0]?.ean || '', // Taking first item's EAN as example
        address: {
          firstName: order.details?.[0]?.s_firstName || '',
          surname: order.details?.[0]?.s_surname || '',
          streetName: order.details?.[0]?.s_streetName || '',
          houseNumber: order.details?.[0]?.s_houseNumber || '',
          houseNumberExtension: order.details?.[0]?.s_houseNumberExtension || '',
          zipCode: order.details?.[0]?.s_zipCode || '',
          city: order.details?.[0]?.s_city || ''
        }
      })) || [];
      form.setValue('selectedItems', allItemsWithAddress);
    }
  }, [selectedItems, allOrderIds, data, form]);

  const onSubmit = async (data) => {
    console.log('Form submitted with address info:', data);
    try {
      toast({
        title: "Submission successful",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
        action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isPending || isFetching) return 'Loading...';
  if (error) return 'No Orders!';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Top Select All Checkbox */}
        <div className="sticky top-0 bg-white p-4 border-b z-10">
          <FormField
            control={form.control}
            name="selectedItems"
            render={() => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={selectedItems.length === allOrderIds.length && allOrderIds.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </FormControl>
                <FormLabel className="text-sm font-medium">
                  {selectedItems.length === allOrderIds.length ? 'Deselect All' : 'Select All'}
                </FormLabel>
                <span className="text-sm text-gray-500">
                  {selectedItems.length} of {allOrderIds.length} selected
                </span>
              </FormItem>
            )}
          />
        </div>

        <ul className="space-y-4">
          {data.map((order) => (
            <li key={order.orderId}>
              <Card className='bg-zinc-50'>
                <CardHeader>
                  <CardTitle className='flex justify-between'>
                    <div>
                      <h1 className='text-2xl'>{order.orderId}</h1>
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="selectedItems"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.some(item => item.orderId === order.orderId)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    // Add order with address information when checked
                                    const newItem = {
                                      orderId: order.orderId,
                                      ean: order.details?.[0]?.ean || '', // Taking first item's EAN
                                      address: {
                                        firstName: order.details?.[0]?.s_firstName || '',
                                        surname: order.details?.[0]?.s_surname || '',
                                        streetName: order.details?.[0]?.s_streetName || '',
                                        houseNumber: order.details?.[0]?.s_houseNumber || '',
                                        houseNumberExtension: order.details?.[0]?.s_houseNumberExtension || '',
                                        zipCode: order.details?.[0]?.s_zipCode || '',
                                        city: order.details?.[0]?.s_city || ''
                                      }
                                    };
                                    field.onChange([...currentValue, newItem]);
                                  } else {
                                    // Remove order when unchecked
                                    field.onChange(currentValue.filter(item => item.orderId !== order.orderId));
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <h2 className='text-5xl'>{account}</h2>
                    </div>
                  </CardTitle>
                </CardHeader>

                {(Array.isArray(order.details) ? order.details : []).map((odr) => (
                  <div key={odr.ean}>
                    <Suspense fallback={<p>Loading feed...</p>}>
                      <CardContent className={odr.quantity >= 2 ? 'border-8 border-red-700 pt-5' : ''}>
                        <div className='flex items-center'>
                          <figure className={`${odr.method == 'BOL' ? 'bg-sky-500' : 'bg-orange-500'} p-3 rounded-md`}>
                            <Suspense fallback={<p>Loading feed...</p>}>
                              <Img ean={odr.ean} account={odr.account} />
                            </Suspense>

                            <figcaption className={`mt-2 p-4 text-l font-bold text-center text-white-900 dark:text-gray-900 ${
                              odr.latestDeliveryDate ?? `bg-red-600 rounded-md`
                            }`}>
                              {odr.exactDeliveryDate
                                ? `Exact: ${formatter.format(new Date(odr.exactDeliveryDate))}`
                                : isValidDate(odr.latestDeliveryDate)
                                ? `${formatter.format(new Date(odr.latestDeliveryDate))}`
                                : 'Invalid date'}
                            </figcaption>
                          </figure>

                          <div className='w-2/3'>
                            <CardTitle className='flex items-center'>
                              <h1 className='w-4/5 p-5'>
                                {odr.title} <br />
                                <br />
                                <Link href={`https://www.bol.com/nl/nl/s/?searchtext=${odr.ean}`} target='_blank'>
                                  <p className='text-blue-500'>EAN {odr.ean}</p>
                                </Link>
                              </h1>
                              <h1 className={`${odr.quantity >= 2 ? 'bg-red-500' : 'bg-sky-500/100'} p-3 text-9xl w-1/5 p-5 text-center rounded-md`}>
                                {odr.quantity}
                              </h1>
                            </CardTitle>
                            <CardDescription>
                              <h1>
                                {odr.s_firstName} {odr.s_surname}
                              </h1>
                              <p>
                                {odr.s_streetName} {odr.s_houseNumber} {odr.s_houseNumberExtension}
                              </p>
                              <p>
                                {odr.s_zipCode} {odr.s_city}
                              </p>
                              <p>{odr.method}</p>
                            </CardDescription>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter>
                        {odr.distributionParty == 'BOL' ? '' : (
                          <div onClick={(e) => e.preventDefault()}>
                            <LabelButtonQLS odr={odr} />
                          </div>
                        )}
                      </CardFooter>
                    </Suspense>
                  </div>
                ))}
              </Card>
            </li>
          ))}
        </ul>

        {/* Bottom Select All Checkbox and Submit Button */}
        <div className="sticky bottom-0 bg-white p-4 border-t z-10">
          <div className="flex justify-between items-center">
            <FormField
              control={form.control}
              name="selectedItems"
              render={() => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={selectedItems.length === allOrderIds.length && allOrderIds.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium">
                    {selectedItems.length === allOrderIds.length ? 'Deselect All' : 'Select All'}
                  </FormLabel>
                  <span className="text-sm text-gray-500">
                    {selectedItems.length} of {allOrderIds.length} selected
                  </span>
                </FormItem>
              )}
            />
            <Button type="submit">Submit Selected Items</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default AllOrders;