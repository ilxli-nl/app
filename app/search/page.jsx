
"use client"
import { useState } from "react";
import { searchOrders } from '../actions/actions'
import { SearchOrders } from "../components/SearchOrders";

export default function OrdersPage() {
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    try {
      const data = await searchOrders(query || ""); // Ensure we never pass null
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Order Search</h1>
      <SearchOrders onSearch={handleSearch} />
      
      {/* Results display remains the same */}
      {results.length > 0 ? (
        <div className="mt-6 space-y-4">
          {/* Render results */}
        </div>
      ) : (
        <p className="mt-4 text-gray-500">
          {results.length === 0 ? "No orders found." : "Enter a search term."}
        </p>
      )}
    </div>
  );
}