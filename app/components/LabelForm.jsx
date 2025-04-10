"use client"; // Client-side component

import { useState } from "react";
import { createBpostLabel } from "../actions/bpost";

export default function LabelForm() {
  const [labelUrl, setLabelUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Example order data (customize fields as needed)
    const orderData = {
      orderReference: `ORDER-${Date.now()}`,
      sender: {
        name: event.target.senderName.value,
        address: {
          street: event.target.senderStreet.value,
          postalCode: event.target.senderPostalCode.value,
          locality: event.target.senderCity.value,
          country: "BE",
        },
      },
      // Add recipient/parcel data here
      parcels: [{
        weight: 1000, // in grams
        barcode: `PARCEL-${Date.now()}`,
      }],
    };

    console.log(orderData)

    try {
      const result = await createBpostLabel(orderData);
      setLabelUrl(result.label.url); // Show download link
    } catch (error) {
      alert("Failed to create label: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sender Details</h2>
      <input name="senderName" placeholder="Name" required />
      <input name="senderStreet" placeholder="Street" required />
      <input name="senderPostalCode" placeholder="Postal Code" required />
      <input name="senderCity" placeholder="City" required />

      {/* Add recipient/parcel fields here */}

      <button type="submit">Create Label</button>

      {labelUrl && (
        <div>
          <a href={labelUrl} target="_blank" rel="noopener">
            Download Label (PDF)
          </a>
        </div>
      )}
    </form>
  );
}