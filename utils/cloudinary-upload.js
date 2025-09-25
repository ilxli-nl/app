import cloudinary from '@/lib/cloudinary';

export async function uploadToCloudinary(fileBuffer, fileName, ean) {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'warehouse/products',
          public_id: `product_${ean}_${Date.now()}`,
          tags: ['product', ean],
          resource_type: 'image',
          format: 'auto',
          quality: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}
