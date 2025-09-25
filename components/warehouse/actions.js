'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/prisma';
import { cloudinary } from '@/lib/cloudinary';

export async function uploadProductImage(formData) {
  try {
    const file = formData.get('file');
    const ean = formData.get('ean');

    if (!file || !ean) {
      return { success: false, error: 'File and EAN are required' };
    }

    // Convert file to buffer for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'warehouse/products',
          public_id: `product_${ean}_${Date.now()}`,
          tags: ['product', ean],
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Save to database using ProductImage model
    const productImage = await prisma.productImage.upsert({
      where: { ean },
      update: {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        updatedAt: new Date(),
      },
      create: {
        ean,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });

    // Update product's imageUrl for backward compatibility
    await prisma.product.upsert({
      where: { ean },
      update: {
        imageUrl: uploadResult.secure_url,
        updatedAt: new Date(),
      },
      create: {
        ean,
        name: `Product ${ean}`,
        imageUrl: uploadResult.secure_url,
      },
    });

    return {
      success: true,
      imageUrl: productImage.imageUrl,
      publicId: productImage.publicId,
    };
  } catch (error) {
    console.error('Error uploading product image:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProductImage(ean, publicId) {
  try {
    // Delete from Cloudinary
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete from database
    await prisma.productImage.delete({
      where: { ean },
    });

    // Clear product imageUrl
    await prisma.product.update({
      where: { ean },
      data: {
        imageUrl: null,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting product image:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductImages(eans) {
  try {
    // First try to get from ProductImage table (new system)
    const productImages = await prisma.productImage.findMany({
      where: {
        ean: {
          in: eans,
        },
      },
    });

    const imageMap = {};
    productImages.forEach((image) => {
      imageMap[image.ean] = image.imageUrl;
    });

    // For any missing images, try the legacy Images table
    const missingEans = eans.filter((ean) => !imageMap[ean]);
    if (missingEans.length > 0) {
      const legacyImages = await prisma.images.findMany({
        where: {
          ean: {
            in: missingEans,
          },
        },
      });

      legacyImages.forEach((image) => {
        imageMap[image.ean] = image.image;
      });
    }

    return imageMap;
  } catch (error) {
    console.error('Error fetching product images:', error);
    return {};
  }
}

export async function getLocations() {
  try {
    const locations = await prisma.warehouseLocation.findMany({
      select: {
        id: true,
        code: true,
        description: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export async function getProductsAndLocations() {
  try {
    const products = await prisma.product.findMany({
      include: {
        locations: {
          include: {
            location: true,
          },
        },
      },
    });

    const locations = await prisma.warehouseLocation.findMany();

    return { products, locations };
  } catch (error) {
    console.error('Error fetching products and locations:', error);
    return { products: [], locations: [] };
  }
}

// Assign product to location
export async function assignProductToLocation(prevState, formData) {
  try {
    // Validate form data
    if (!formData || typeof formData.get !== 'function') {
      throw new Error('Invalid form data received');
    }

    // Get current user with proper validation
    const currentUser = await getCurrentUser();
    if (!currentUser?.name) {
      throw new Error('You must be logged in to perform this action');
    }

    // Validate user data
    if (!currentUser.email) {
      console.error('Invalid user data:', currentUser);
      throw new Error('Invalid user authentication data');
    }

    // Get and validate form inputs
    const productId = formData.get('productId');
    const locationId = formData.get('locationId');
    const quantity = parseInt(formData.get('quantity') || '0');

    if (!productId || !locationId || isNaN(quantity) || quantity <= 0) {
      throw new Error(
        'Valid product, location, and positive quantity are required'
      );
    }

    // Process user upsert with proper fields
    const dbUser = await prisma.user.upsert({
      where: {
        id: currentUser.name,
      },
      update: {
        email: currentUser.email,
        username: currentUser.name,
        img: currentUser.image,
        updatedAt: new Date(),
      },
      create: {
        id: currentUser.name,
        email: currentUser.email,
        username: currentUser.name,
        displayName: currentUser.name,
        img: currentUser.image,
      },
    });

    // Process product assignment
    const existingAssignment = await prisma.productLocation.findFirst({
      where: { productId, locationId },
    });

    let result;
    if (existingAssignment) {
      result = await prisma.productLocation.update({
        where: { id: existingAssignment.id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      result = await prisma.productLocation.create({
        data: { productId, locationId, quantity },
      });
    }

    // Create history record
    await prisma.productLocationHistory.create({
      data: {
        recordId: result.id,
        userId: currentUser.name,
        action: existingAssignment ? 'UPDATE' : 'CREATE',
        field: 'quantity',
        oldValue: existingAssignment?.quantity.toString() || '0',
        newValue: result.quantity.toString(),
        createdAt: new Date(),
      },
    });

    revalidatePath('/warehouse');
    return {
      success: true,
      message: `Product assigned to location successfully`,
      assignment: result,
    };
  } catch (error) {
    console.error('Assignment error:', {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    });
    return {
      success: false,
      error: error.message,
      message: `Assignment failed: ${error.message}`,
    };
  }
}

// Location Actions
export async function createLocation(prevState, formData) {
  try {
    // Debug: Log formData contents
    const formDataObj = Object.fromEntries(formData);
    console.log('Form data received:', formDataObj);

    // Validate required fields
    const code = formData.get('code');
    const description = formData.get('description') || null;

    if (!code) {
      throw new Error('Location code is required');
    }

    // Check for existing location
    const existingLocation = await prisma.warehouseLocation.findUnique({
      where: { code },
    });

    if (existingLocation) {
      throw new Error(`Location ${code} already exists`);
    }

    // Create new location
    const newLocation = await prisma.warehouseLocation.create({
      data: {
        code,
        description,
      },
    });

    console.log('Location created:', newLocation);

    revalidatePath('/warehouse');
    return {
      success: true,
      message: `Location ${code} created successfully`,
      location: newLocation,
    };
  } catch (error) {
    console.error('Location creation failed:', {
      error: error.message,
      stack: error.stack,
      formData: formData ? Object.fromEntries(formData) : 'No form data',
    });
    return {
      success: false,
      error: error.message,
      message: `Failed to create location: ${error.message}`,
    };
  }
}

export async function createOrUpdateProduct(prevState, formData) {
  try {
    const ean = formData.get('ean');
    const name = formData.get('name');
    const description = formData.get('description');
    const imageUrl = formData.get('imageUrl');
    const file = formData.get('imageFile');

    if (!ean || !name) {
      return {
        success: false,
        message: 'EAN and Product Name are required',
      };
    }

    let finalImageUrl = imageUrl;

    // Handle file upload if a file was provided
    if (file && file.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('ean', ean);

      const uploadResult = await uploadProductImage(uploadFormData);
      if (uploadResult.success) {
        finalImageUrl = uploadResult.imageUrl;
      } else {
        return {
          success: false,
          message: 'Failed to upload image',
          error: uploadResult.error,
        };
      }
    }

    // Create or update product
    const product = await prisma.product.upsert({
      where: { ean },
      update: {
        name,
        description,
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
        updatedAt: new Date(),
      },
      create: {
        ean,
        name,
        description,
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
      },
    });

    // Also update the legacy Images table for backward compatibility
    if (finalImageUrl) {
      await prisma.images.upsert({
        where: { ean },
        update: { image: finalImageUrl },
        create: { ean, image: finalImageUrl },
      });
    }

    revalidatePath('/warehouse');
    return {
      success: true,
      message: `Product ${product.ean ? 'updated' : 'created'} successfully!`,
      product,
    };
  } catch (error) {
    console.error('Error creating/updating product:', error);
    return {
      success: false,
      message: 'Failed to save product',
      error: error.message,
    };
  }
}

export async function forceDeleteProduct(prevState, formData) {
  try {
    const ean = formData.get('ean');

    if (!ean) {
      return {
        success: false,
        message: 'EAN is required',
      };
    }

    // Use a transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // Delete related history
      await tx.productLocationHistory.deleteMany({
        where: {
          ProductLocation: {
            product: {
              ean: ean,
            },
          },
        },
      });

      // Delete product locations
      await tx.productLocation.deleteMany({
        where: {
          product: {
            ean: ean,
          },
        },
      });

      // Delete related images from both tables
      await tx.images.deleteMany({
        where: { ean },
      });

      await tx.productImage.deleteMany({
        where: { ean },
      });

      // Delete the product
      await tx.product.delete({
        where: { ean },
      });
    });

    revalidatePath('/warehouse');
    return {
      success: true,
      message: 'Product and all related data deleted successfully',
    };
  } catch (error) {
    console.error('Force delete product error:', error);
    return {
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    };
  }
}

export async function getLocationProducts(locationCode) {
  try {
    const location = await prisma.warehouseLocation.findUnique({
      where: { code: locationCode },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!location) {
      return { error: 'Location not found' };
    }

    return {
      location: {
        id: location.id,
        code: location.code,
        description: location.description,
      },
      products: location.products,
    };
  } catch (error) {
    console.error('Error fetching location products:', error);
    return { error: 'Failed to fetch location data' };
  }
}

export async function deleteProductFromLocation(productLocationId) {
  try {
    // First check if the product location exists
    const productLocation = await prisma.productLocation.findUnique({
      where: { id: productLocationId },
    });

    if (!productLocation) {
      return { error: 'Product assignment not found' };
    }

    // Delete the product from the location
    await prisma.productLocation.delete({
      where: { id: productLocationId },
    });

    revalidatePath('/warehouse');
    return {
      success: true,
      message: 'Product removed from location successfully',
    };
  } catch (error) {
    console.error('Error deleting product from location:', error);
    return { error: 'Failed to remove product from location' };
  }
}

export async function scanLocation(prevState, formData) {
  try {
    const locationCode = formData.get('locationCode');

    const location = await prisma.warehouseLocation.findUnique({
      where: { code: locationCode },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!location) return { error: 'Location not found' };

    // Get EANs of all products at this location
    const eans = location.products.map((item) => item.product.ean);

    // Fetch images for these products using the unified function
    const productImages = await getProductImages(eans);

    return {
      location: {
        id: location.id,
        code: location.code,
        description: location.description,
      },
      products: location.products,
      productImages,
    };
  } catch (error) {
    console.error('Scan location error:', error);
    return { error: error.message };
  }
}

export async function scanProduct(prevState, formData) {
  try {
    const productEan = formData.get('productEan');

    // First get the product with basic info
    const product = await prisma.product.findUnique({
      where: { ean: productEan },
      include: {
        locations: {
          include: {
            location: true,
            history: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                user: {
                  select: {
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return { error: 'Product not found' };
    }

    // Get the image using the unified function
    const imageMap = await getProductImages([productEan]);
    const imageUrl = imageMap[productEan] || null;

    return {
      product: {
        id: product.id,
        ean: product.ean,
        name: product.name,
        description: product.description,
        imageUrl: imageUrl,
      },
      locations: product.locations,
    };
  } catch (error) {
    console.error('Product scan error:', error);
    return { error: error.message };
  }
}

// Modification Actions
export async function updateProductQuantity(prevState, formData) {
  try {
    const user = await getCurrentUser();
    if (!user?.name) throw new Error('User authentication failed');

    const assignmentId = formData.get('assignmentId');
    const newQuantity = parseInt(formData.get('newQuantity'));

    if (isNaN(newQuantity) || newQuantity < 0)
      throw new Error('Invalid quantity');

    // Get current quantity for history
    const currentAssignment = await prisma.productLocation.findUnique({
      where: { id: assignmentId },
    });

    if (!currentAssignment) {
      throw new Error('Product assignment not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update the quantity
      const updatedAssignment = await tx.productLocation.update({
        where: { id: assignmentId },
        data: { quantity: newQuantity },
        include: { product: true, location: true },
      });

      // Create history record
      await tx.productLocationHistory.create({
        data: {
          recordId: assignmentId,
          action: 'UPDATE',
          field: 'quantity',
          oldValue: currentAssignment.quantity.toString(),
          newValue: newQuantity.toString(),
          userId: user.name,
        },
      });

      return updatedAssignment;
    });

    revalidatePath('/warehouse');
    revalidatePath('/warehouse/location-scanner');

    return {
      success: true,
      message: 'Quantity updated successfully',
      updatedAssignment: result,
      newQuantity: newQuantity,
    };
  } catch (error) {
    console.error('Update quantity error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function moveProductLocation(prevState, formData) {
  try {
    const user = await getCurrentUser();
    if (!user?.name) throw new Error('User authentication failed');

    const assignmentId = formData.get('assignmentId');
    const newLocationId = formData.get('newLocationId');

    if (!assignmentId) throw new Error('Missing assignment ID');
    if (!newLocationId) throw new Error('Missing new location ID');

    // Get the current assignment
    const currentAssignment = await prisma.productLocation.findUnique({
      where: { id: assignmentId },
      include: {
        location: true,
        product: true,
      },
    });

    if (!currentAssignment) {
      throw new Error('Product assignment not found');
    }

    // Verify the new location exists
    const newLocation = await prisma.warehouseLocation.findUnique({
      where: { id: newLocationId },
    });

    if (!newLocation) throw new Error('New location not found');

    let result;

    await prisma.$transaction(async (tx) => {
      // Check if product already exists at the new location
      const existingAssignment = await tx.productLocation.findFirst({
        where: {
          productId: currentAssignment.productId,
          locationId: newLocationId,
        },
      });

      if (existingAssignment) {
        // If product already exists at new location, update quantity and delete old
        result = await tx.productLocation.update({
          where: { id: existingAssignment.id },
          data: {
            quantity: existingAssignment.quantity + currentAssignment.quantity,
          },
        });

        await tx.productLocation.delete({
          where: { id: assignmentId },
        });
      } else {
        // If product doesn't exist at new location, move it
        result = await tx.productLocation.update({
          where: { id: assignmentId },
          data: { locationId: newLocationId },
        });
      }

      // Create history record
      await tx.productLocationHistory.create({
        data: {
          recordId: assignmentId,
          action: 'MOVE',
          field: 'location',
          oldValue: currentAssignment.location.code,
          newValue: newLocation.code,
          userId: user.name,
        },
      });
    });

    revalidatePath('/warehouse');
    return {
      success: true,
      message: 'Product moved successfully',
    };
  } catch (error) {
    console.error('Move location error:', error);
    return {
      success: false,
      error: error.message || 'Failed to move product location',
    };
  }
}

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        locations: {
          include: {
            location: true,
            history: {
              include: {
                user: {
                  select: {
                    username: true,
                    displayName: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function deleteProduct(prevState, formData) {
  try {
    const ean = formData.get('ean');

    if (!ean) {
      return {
        success: false,
        message: 'EAN is required to delete a product',
      };
    }

    // First, check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { ean },
      include: {
        locations: {
          include: {
            history: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if product has locations assigned
    if (existingProduct.locations.length > 0) {
      return {
        success: false,
        message:
          'Cannot delete product - it is assigned to locations. Please remove from all locations first.',
      };
    }

    // Delete related images from both tables
    await prisma.images.deleteMany({
      where: { ean },
    });

    await prisma.productImage.deleteMany({
      where: { ean },
    });

    // Delete the product
    await prisma.product.delete({
      where: { ean },
    });

    revalidatePath('/warehouse');
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    console.error('Delete product error:', error);

    let errorMessage = 'Failed to delete product';
    if (error.code === 'P2025') {
      errorMessage = 'Product not found';
    } else if (error.code === 'P2003') {
      errorMessage = 'Cannot delete product due to existing references';
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message,
    };
  }
}

// Utility function to get total product quantity
export async function getProductTotalQuantity(productId) {
  try {
    const locations = await prisma.productLocation.findMany({
      where: { productId },
      select: { quantity: true },
    });

    return locations.reduce((total, loc) => total + loc.quantity, 0);
  } catch (error) {
    console.error('Error getting total quantity:', error);
    return 0;
  }
}
