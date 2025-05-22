"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { useForm } from '@tanstack/react-form'
import { ComboOrders, submitToShipping } from '@/app/actions/actions'
import { useQuery } from '@tanstack/react-query'
import { Checkbox } from "./ui/checkbox"
import { useState } from 'react'

const OrderList = () => {
  const page = 1
  const account = 'BE'
  const [submissionResult, setSubmissionResult] = useState(null)

  // Fetch orders data
  const { isPending, error, data } = useQuery({
    queryKey: ['Orders', page],
    queryFn: () => ComboOrders(page, account),
  })

  // Initialize form with orders data
  const form = useForm({
    defaultValues: {
      orders: data?.map(order => ({
        id: order.details.orderId,
        checked: false,
        name: order.details.ean,
        streetName: order.details.streetName,
        number: order.details.number,
        Locality: order.details.Locality,
        PostalCode: order.details.PostalCode,
        CountryCode: order.details.CountryCode,
        PhoneNumber: order.details.PhoneNumber,
        Email: order.details.Email,
        OrderReference: order.details.OrderReference,
        Shipping: order.details.Shipping,
      })) || [],
      selectAll: false
    },
    onSubmit: async ({ value }) => {
      const ordersToShip = value.orders
        .filter(order => order.checked)
        .map(order => ({
          orderId: order.id,
          name: order.name,
          address: `${order.streetName} ${order.number}, ${order.PostalCode} ${order.Locality}`
        }))

      if (ordersToShip.length === 0) {
        setSubmissionResult('Please select at least one order to ship')
        return
      }

      try {
        const result = await submitToShipping(ordersToShip)
        setSubmissionResult(result.message)
      } catch (error) {
        console.error('Shipping submission error:', error)
        setSubmissionResult('Failed to submit orders. Please try again.')
      }
    }
  })

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    const currentOrders = form.getFieldValue('orders')
    form.setFieldValue('selectAll', checked)
    form.setFieldValue('orders', currentOrders.map(order => ({
      ...order,
      checked
    })))
  }

  if (isPending) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4">No Orders Found</div>

  const orders = form.getFieldValue('orders')
  const selectAll = form.getFieldValue('selectAll')


  console.log(orders)

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Order Shipping</h1>
      
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        {/* Select All checkbox */}
        <div className="flex items-center mb-4 p-2 bg-gray-100 rounded">
          <Checkbox
            id="select-all"
            checked={selectAll}
            onCheckedChange={handleSelectAll}
            className="mr-2"
          />
          <label htmlFor="select-all" className="font-medium">
            Select All Orders
          </label>
        </div>

        {/* Orders list */}
        <div className="space-y-4 mb-4">
          {orders.map((order, index) => (
            <Card key={order.id} className="border rounded-lg overflow-hidden">
              <CardHeader className="flex items-center space-x-3 p-4 bg-gray-50">
                <form.Field
                  name={`orders.${index}.checked`}
                  children={(field) => (
                    <Checkbox
                      id={`order-${order.id}`}
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked)
                        if (!checked && selectAll) {
                          form.setFieldValue('selectAll', false)
                        }
                      }}
                    />
                  )}
                />
                <div>
                  <CardTitle className="text-lg">{order.name}</CardTitle>
                  <CardDescription>Order #{order.id}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <p><span className="font-medium">Address:</span> {order.streetName} {order.number}, {order.PostalCode} {order.Locality}</p>
                <p><span className="font-medium">Contact:</span> {order.PhoneNumber} | {order.Email}</p>
                <p><span className="font-medium">Reference:</span> {order.OrderReference}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={form.state.isSubmitting}
          >
            {form.state.isSubmitting ? 'Submitting...' : 'Submit Selected Orders'}
          </button>
        </div>

        {/* Submission result message */}
        {submissionResult && (
          <div className="mt-4 p-3 rounded bg-gray-100">
            {submissionResult}
          </div>
        )}
      </form>
    </div>
  )
}

export default OrderList