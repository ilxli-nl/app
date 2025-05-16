'use client';

import { useForm, FormProvider } from '@tanstack/react-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import OrderBE from './OrderBE';

export function  ShippingLabelForm({ orders = [] }) {

  const account = 'BE';

  // const id = orders[0].orderId


  //   const { isPending, isError, data, isFetching } = useQuery({
  //     queryKey: [`Order${id}`],
  //     queryFn: ({}) => OrderBol(id, 'BE'),
  //   })
  
  //   if (isPending) return 'Loading...'
  //   if (isError)
  //     return 'An error has occurred: ' + isError.message + ' -> ' + account
  //   if (isError) return 'No Ordders!'



  //   console.log(data)





  const form = useForm({
    defaultValues: {
      orders: orders.map(order => ({
        id: order.orderId,
        checked: false,
        name: order.ean,
        streetName: order.streetName,
        number: order.number,
        Locality: order.Locality,
        PostalCode: order.PostalCode,
        CountryCode: order.CountryCode,
        PhoneNumber: order.PhoneNumber,
        Email: order.Email,
        OrderReference: order.OrderReference,
        Shipping: order.Shipping,
      }))
    },
    onSubmit: async ({ value }) => {
      const ordersToShip = value.orders.filter(order => order.checked);
      
      if (ordersToShip.length === 0) {
        alert('Please select at least one order to ship');
        return;
      }

      try {
        console.log('Submitting orders:', ordersToShip);
        alert(`Would submit ${ordersToShip.length} orders to shipping API`);

      } catch (error) {
        console.error('Error submitting shipping labels:', error);
        alert('Error submitting shipping labels. Please try again.');
      }
    }
  });



  //console.log(data)


  // Get current form values
  const formValues = form.getFieldValue('orders');
  
  // Calculate if all are checked
  const allChecked = formValues.length > 0 && formValues.every(order => order.checked);

  // Toggle all checkboxes
  const toggleAll = (shouldCheck) => {
    form.setFieldValue(
      'orders',
      formValues.map(order => ({
        ...order,
        checked: shouldCheck
      }))
    );
  };

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    toggleAll(!allChecked);
  };

  return (
    <FormProvider form={form}>
    <form
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Top Select All Control */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
        <Checkbox
          id="select-all-top"
          checked={allChecked}
          onCheckedChange={handleSelectAllChange}
        />
        <Label htmlFor="select-all-top" className="text-sm font-medium leading-none">
          {allChecked ? 'Deselect All' : 'Select All'}
        </Label>
      </div>

      {/* Orders List */}
      <div className="grid grid-rows">
        {form.Field({
          name: 'orders',
          children: (field) => (
            <>
              {field.state.value.map((order, index) => (
                <Card key={order.id}>
                  <CardHeader className="flex flex-row items-center space-x-2 space-y-0">
                    <form.Field
                      name={`orders.${index}.checked`}
                      children={(checkboxField) => (
                        <Checkbox
                          id={`order-${order.id}`}
                          checked={checkboxField.state.value}
                          onCheckedChange={(checked) => checkboxField.handleChange(checked)}
                          className="mt-1"
                        />
                      )}
                    />
                    <div>
                      <CardTitle className="text-lg">{order.name}</CardTitle>
                      <CardDescription>Order #{order.id}</CardDescription>
                      <p>{order.name}</p>
                    </div>
                  </CardHeader>
          
                      <OrderBE id={order.id} account={account} index={0}/>
                
                </Card>
              ))}
            </>
          )
        })}
      </div>

      {/* Bottom Select All Control */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
        <Checkbox
          id="select-all-bottom"
          checked={allChecked}
          onCheckedChange={handleSelectAllChange}
        />
        <Label htmlFor="select-all-bottom" className="text-sm font-medium leading-none">
          {allChecked ? 'Deselect All' : 'Select All'}
        </Label>
      </div>

      <div className="mt-6">
       
        <Button type="submit" className="w-full sm:w-auto">
          Generate Shipping Labels
        </Button>
      </div>
    </form>
    </FormProvider>
  );
}