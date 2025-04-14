"use client";

import { useState } from 'react';
import { createBpostOrder } from '@/actions/bpost';

export default function LabelForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createBpostOrder();
      setOrderResult(result);
      console.log("Order created:", result);
    } catch (err) {
      setError(err.message);
      console.error("Error creating order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Create bpost Order</h1>
      
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-md text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? 'Creating Order...' : 'Create Order'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {orderResult && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          <h2 className="font-bold">Order Created Successfully!</h2>
          <pre className="text-xs mt-2 overflow-x-auto">
            {JSON.stringify(orderResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}