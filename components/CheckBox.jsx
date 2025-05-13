"use client"
import { CardContent, CardHeader } from "./ui/card"
import { useForm } from '@tanstack/react-form';



const CheckBox = (orders) => {






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

      // id: 'ORD-9999',
      // name: 'Jhuyhf Hyet',
      // streetName: 'Main St',
      // number: 166,
      // Locality: 'New York',
      // PostalCode: '10001',
      // CountryCode: 'USA',
      // PhoneNumber: '1231321321321',
      // Email: 'ashdsd@kjshfdsf.nl',
      // OrderReference: 'CCCCCCC',
      // Shipping: 'BE',



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



  const formValues = form.getFieldValue('orders');



  return (



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
                      <CardContent className="space-y-2">
                        {/* ... rest of your card content ... */}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )
            })}
     
  )
 
}


export default CheckBox
