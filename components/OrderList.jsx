'use client'
import { ComboOrders, SubmitForm } from '@/app/actions/actions';
import { createBpostLabel, generateBpostPdf } from '@/app/actions/bpost';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useCallback, useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formatter = new Intl.DateTimeFormat('nl-NL')
function isValidDate(d) {
  const date = new Date(d)
  return d && !isNaN(date)
}

const FormSchema = z.object({
  selectedItems: z.array(z.object({
    orderId: z.string(),
    address: z.object({
      name: z.string(),
      StreetName: z.string(),
      houseNumber: z.string(),
      PostalCode: z.string(),
      Locality: z.string(),
      CountryCode: z.string(),
      OrderReference: z.string(),
      Email: z.string()
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const allOrderIds = data?.map(order => order.orderId) || [];

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === allOrderIds.length) {
      form.setValue('selectedItems', []);
    } else {
      const allItemsWithAddress = data?.map(order => ({
        orderId: order.orderId,
        address: {
          name: `${order.details?.[0]?.s_firstName} ${order.details?.[0]?.s_surname}` || '',
          StreetName: order.details?.[0]?.s_streetName || '',
          houseNumber: order.details?.[0]?.s_houseNumber || '' + ' ' + order.details?.[0]?.s_houseNumberExtension || '',
          PostalCode: order.details?.[0]?.s_zipCode || '',
          Locality: order.details?.[0]?.s_city || '',
          CountryCode: order.details?.[0]?.s_countryCode || '',
          OrderReference: order.orderId || '',
          Email: order.details?.[0]?.email || '' 
        }
      })) || [];
      form.setValue('selectedItems', allItemsWithAddress);
    }
  }, [selectedItems, allOrderIds, data, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log('Form update:', value, name, type);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data) => {
    try {
      if (!data.selectedItems || !data.selectedItems.length) {
        throw new Error('No items selected for label creation');
      }

      const transformedItems = data.selectedItems.map(item => ({
        Name: item.address?.name,
        StreetName: item.address?.StreetName,
        Number: item.address?.houseNumber,
        Locality: item.address?.Locality,
        PostalCode: item.address?.PostalCode,
        CountryCode: item.address?.CountryCode || 'BE',
        Email: item.address?.Email,
        OrderReference: item.orderId,
        Shipping: item.address?.shipping || 'PRO'
      }));

      const results = [];
      for (const item of transformedItems) {
        try {
          const result = await createBpostLabel(item);
          results.push(result);
        } catch (error) {
          console.error('Failed to create label for:', item.OrderReference, error);
        }
      }

      toast({
        title: `Created ${results.length}/${transformedItems.length} labels`,
        description: results.length ? (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">
              {JSON.stringify(results[0], null, 2)}
            </code>
          </pre>
        ) : 'No labels were created',
      });

    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        variant: "destructive",
        title: "Label creation failed",
        description: error.message,
      });
    }
  };

  // Update your handleGeneratePdf function in AllOrders component
const handleGeneratePdf = async () => {
  if (!selectedItems.length) {
    toast({
      variant: "destructive",
      title: "No items selected",
      description: "Please select at least one item to generate PDF",
    });
    return;
  }

  setIsGeneratingPdf(true);

  try {
    // Prepare order references for the external API
    const orderReferences = selectedItems.map(item => `Test${item.orderId}test`);

    // Call the server action
    const pdfBuffer = await generateBpostPdf(orderReferences);
    
    // Create a blob from the buffer
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    
    // Create a URL for the blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open in new window for printing
    const newWindow = window.open(pdfUrl, '_blank');
    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    toast({
      title: "PDF Labels Generated",
      description: "The Bpost labels PDF has been opened in a new window.",
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
    toast({
      variant: "destructive",
      title: "PDF Generation Failed",
      description: error.message,
    });
  } finally {
    setIsGeneratingPdf(false);
    setIsDialogOpen(false);
  }
};

  if (isPending || isFetching) return 'Loading...';
  if (error) return 'No Orders!';

  return (
    <>
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
                        <div className='flex flex-row items-start space-x-3 space-y-0'>
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
                                        const newItem = {
                                          orderId: order.orderId,
                                          address: {
                                            name: `${order.details?.[0]?.s_firstName} ${order.details?.[0]?.s_surname}` || '',
                                            StreetName: order.details?.[0]?.s_streetName || '',
                                            houseNumber: order.details?.[0]?.s_houseNumber || '' + order.details?.[0]?.s_houseNumberExtension || '',
                                            PostalCode: order.details?.[0]?.s_zipCode || '',
                                            Locality: order.details?.[0]?.s_city || '',
                                            CountryCode: order.details?.[0]?.s_countryCode || '',
                                            OrderReference: order.orderId || '',
                                            Email: order.details?.[0]?.email || '' 
                                          }
                                        };
                                        field.onChange([...currentValue, newItem]);
                                      } else {
                                        field.onChange(currentValue.filter(item => item.orderId !== order.orderId));
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <h1 className='text-2xl'>{order.orderId}</h1>
                        </div>
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

                  <CardDescription>
                    <h1>
                      {order.details?.[0]?.s_firstName} {order.details?.[0]?.s_surname}
                    </h1>
                    <p>
                      {order.details?.[0]?.s_streetName} {order.details?.[0]?.s_houseNumber} {order.details?.[0]?.s_houseNumberExtension}
                    </p>
                    <p>
                      {order.details?.[0]?.s_zipCode} {order.details?.[0]?.s_city}
                    </p>
                    <p>{order.details?.[0]?.method}</p>
                  </CardDescription>
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
              <div className="flex gap-2">
                <Button type="submit">Submit Selected Items</Button>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Generate Bpost Labels
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-red-0">
                    <DialogHeader>
                      <DialogTitle>Generate Bpost Labels</DialogTitle>
                      <DialogDescription>
                        This will generate PDF labels for {selectedItems.length} selected orders using the Bpost API.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="text-sm">
                        <p>The following order references will be sent to Bpost:</p>
                        <ul className="mt-2 max-h-40 overflow-y-auto border rounded p-2">
                          {selectedItems.map((item) => (
                            <li key={item.orderId} className="py-1">
                              {item.orderId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf || !selectedItems.length}
                      >
                        {isGeneratingPdf ? 'Generating Labels...' : 'Generate Labels'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}

export default AllOrders;