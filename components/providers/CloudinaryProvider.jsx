'use client';

import { CldContext } from 'next-cloudinary';
import { useState, useEffect } from 'react';

export default function CloudinaryProvider({ children }) {
  const [cloudName, setCloudName] = useState('');

  useEffect(() => {
    // This ensures we only run on client side
    setCloudName(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '');
  }, []);

  if (!cloudName) {
    return <>{children}</>;
  }

  return (
    <CldContext cloudName={cloudName}>
      {children}
    </CldContext>
  );
}