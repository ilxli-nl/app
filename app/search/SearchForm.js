// app/search/SearchForm.js
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SearchForm({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='mb-8'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search...'
          className='border p-2 mr-2 w-64'
        />
        <button type='submit' className='bg-blue-500 text-white p-2 rounded'>
          Search
        </button>
      </form>
    </div>
  );
}
