"use client";

import { useState } from "react";

export function SearchOrders({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim() === "") {
      onSearch(""); // Explicitly pass empty string instead of null
    } else {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Order ID, EAN, or Name..."
        className="px-4 py-2 border rounded-lg w-full max-w-md"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Search
      </button>
    </form>
  );
}