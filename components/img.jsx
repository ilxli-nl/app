"use client"
import { useQuery } from '@tanstack/react-query';
import { OrderImg } from '../app/actions/actions';
import Image from 'next/image'

// Constants
const DEFAULT_IMAGE = '/no_image.jpg';
const IMAGE_SIZE = 400;

// Loading component
const ImageLoader = () => (
  <div className="flex items-center justify-center w-[400px] h-[300px] bg-gray-200 rounded-lg">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-300 h-12 w-12"></div>
    </div>
  </div>
)

// Error component
const ImageError = ({ message }) => (
  <div className="flex flex-col items-center justify-center w-[400px] h-[300px] bg-gray-100 rounded-lg border border-gray-300">
    <div className="text-red-500 text-sm mb-2">⚠️ Image Error</div>
    <div className="text-gray-600 text-xs text-center px-2">{message}</div>
  </div>
)

const Img = ({ ean, account }) => {
  const { 
    isPending, 
    error, 
    data, 
    isFetching 
  } = useQuery({ 
    queryKey: ['image', ean, account],
    queryFn: () => OrderImg(ean, account),
    enabled: !!ean && !!account, // Only fetch if ean and account are provided
    staleTime: 1000 * 60 * 30, // 30 minutes - matches cache TTL
    gcTime: 1000 * 60 * 60, // 1 hour cache
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Loading state
  if (isPending || isFetching) {
    return <ImageLoader />;
  }

  // Error state - fallback to default image instead of error message
  if (error) {
    console.warn(`Failed to load image for EAN ${ean}:`, error.message);
    return (
      <Image
        src={DEFAULT_IMAGE}
        width={IMAGE_SIZE}
        height={IMAGE_SIZE}
        alt="Fallback product image"
        className="h-auto object-center"
        priority={false}
      />
    );
  }

  // Use data or fallback to default image
  const imageUrl = data || DEFAULT_IMAGE;

  return (
    <Image
      src={imageUrl}
      width={IMAGE_SIZE}
      height={IMAGE_SIZE}
      alt={`Product image for EAN ${ean}`}
      className="h-auto object-center rounded-lg"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      priority={false} // Set to true for above-the-fold images
      onError={(e) => {
        // If image fails to load, replace with default
        e.target.src = DEFAULT_IMAGE;
      }}
    />
  );
};

export default Img;