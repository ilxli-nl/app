'use client';
import { useState } from 'react';
import { createBpostLabel } from '../actions/bpost';

export default function LabelForm({ data }) {
  const [results, setResults] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('BP');
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [globalError, setGlobalError] = useState(null);

  const addresses = Array.isArray(data) ? data : [data];

  async function handleSubmit(event) {
    event.preventDefault();
    setGlobalError(null);
    setIsPending(true);
    
    const addressesToProcess = selectedAddresses.length ? selectedAddresses : addresses;
    const submissionResults = [];


    console.log(addressesToProcess)

    for (const address of addressesToProcess) {
     // try {
        const formData = new FormData();
        formData.append('name', `${address.s_firstName} ${address.s_surname}`);
        formData.append('streetName', address.s_streetName);
        formData.append('number', address.s_houseNumber);
        formData.append('locality', address.s_city);
        formData.append('postalCode', address.s_zipCode);
        formData.append('countryCode', address.account);
        formData.append('phoneNumber', address.phoneNumber);
        formData.append('email', address.email);
        formData.append('orderReference', `test-${address.orderId}`);
        formData.append('shipping', selectedShipping);

        const result = await createBpostLabel(formData);
        submissionResults.push({
          success: true,
          data: result,
          addressId: address.orderId,
          address: `${address.s_streetName} ${address.s_houseNumber}, ${address.s_city}`
        });
      // } catch (error) {
      //   submissionResults.push({
      //     success: false,
      //     error: error.message,
      //     addressId: address.orderId,
      //     address: `${address.s_streetName} ${address.s_houseNumber}, ${address.s_city}`
      //   });
      // }
    }

    setResults(submissionResults);
    setIsPending(false);
  }

  const handleAddressSelect = (addressId, isChecked) => {
    const address = addresses.find(a => a.orderId === addressId);
    setSelectedAddresses(prev => 
      isChecked 
        ? [...prev, address] 
        : prev.filter(a => a.orderId !== addressId)
    );
  };

  return (
    <>
    {selectedShipping}
     {/* {data.map((address) => (
      <p key={address?.orderId} >{address.orderId}</p>
     ))} */}

    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl mx-auto">
      {/* Shipping Method Selection */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Shipping Method</h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              value="BP" 
              checked={selectedShipping === 'BP'} 
              onChange={() => setSelectedShipping('BP')} 
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700">BP Standard</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              value="PRO_24" 
              checked={selectedShipping === 'PRO_24'} 
              onChange={() => setSelectedShipping('PRO_24')} 
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700">Pro 24</span>
          </label>
        </div>
      </div>

      {/* Address Selection */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Select Addresses</h3>
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.orderId} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`address-${address.orderId}`}
                checked={selectedAddresses.some(a => a.orderId === address.orderId)}
                onChange={(e) => handleAddressSelect(address.orderId, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <label htmlFor={`address-${address.orderId}`} className="flex-1 text-gray-700">
                <p className="font-medium">{address.s_firstName} {address.s_surname}</p>
                <p>{address.s_streetName} {address.s_houseNumber}</p>
                <p>{address.s_city}, {address.s_zipCode}</p>
                <p className="text-sm text-gray-500 mt-1">Order: {address.orderId}</p>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={isPending} 
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Create Shipping Labels'
        )}
      </button>

      {/* Error Display */}
      {globalError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{globalError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Submission Results</h3>
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.address}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success ? 'Label created successfully!' : result.error}
                  </p>
                  {result.success && result.data?.trackingNumber && (
                    <p className="text-sm text-green-700 mt-1">
                      Tracking #: {result.data.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
    </>
  );
}