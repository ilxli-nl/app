'use client';

import React, { useState } from "react";

const BpostOrderForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    number: "",
    postalCode: "",
    city: "",
    country: "BE",
    phone: "",
    email: "",
    lines: [
      { description: "Article description", quantity: 1 },
      { description: "Some others articles", quantity: 5 },
    ],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`Updated ${name}:`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form data:", formData);

    const order = {
      orderReference: `ref_TTTTTTTTTTT}`,
      lines: formData.lines,
      receiver: {
        name: formData.name,
        emailAddress: formData.email,
        phoneNumber: formData.phone,
        address: {
          streetName: formData.street,
          number: formData.number,
          postalCode: formData.postalCode,
          locality: formData.city,
          countryCode: formData.country,
        },
      },
    };

    const box = {
      nationalBox: {
        product: "bpack 24h Pro",
        receiver: order.receiver,
        options: [],
      },
    };

    const payload = {
      orderReference: order.orderReference,
      lines: order.lines,
      boxes: [box],
    };

    try {
      // const accountId = "033209";
      // const apiKey = "ioNigHtWiTatOrTHRemE";
      // const auth = Buffer.from(`${accountId}:${apiKey}`).toString("base64");
      // const response = await fetch("https://api.bpost.be/services/shm/orders", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: "Basic " + auth,
      //   },
      //   body: JSON.stringify(payload),
      // });
      const response = await fetch("/api/bpost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Bpost API error");

      const data = await response.json();
      console.log("Response from Bpost API:", data);
      alert("Order created successfully!");
    } catch (error) {
      console.error("Error creating Bpost order:", error);
      alert("Failed to create order");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">Bpost Order</h2>
      <input name="name" placeholder="Name" onChange={handleChange} required className="w-full border p-2" />
      <input name="street" placeholder="Street" onChange={handleChange} required className="w-full border p-2" />
      <input name="number" placeholder="Number" onChange={handleChange} required className="w-full border p-2" />
      <input name="postalCode" placeholder="Postal Code" onChange={handleChange} required className="w-full border p-2" />
      <input name="city" placeholder="City" onChange={handleChange} required className="w-full border p-2" />
      <input name="phone" placeholder="Phone" onChange={handleChange} required className="w-full border p-2" />
      <input name="email" placeholder="Email" type="email" onChange={handleChange} required className="w-full border p-2" />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit Order
      </button>
    </form>
  );
};

export default BpostOrderForm;