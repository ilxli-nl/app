'use server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/prisma';

export async function getProductImages(eans) {
  try {
    if (!eans || !Array.isArray(eans) || eans.length === 0) {
      return {};
    }

    const images = await prisma.images.findMany({
      where: {
        ean: {
          in: eans,
        },
      },
    });

    // Convert to object with EAN as key
    const imagesByEan = {};
    images.forEach((image) => {
      imagesByEan[image.ean] = image.image;
    });

    return imagesByEan;
  } catch (error) {
    console.error('Error fetching product images:', error);
    return {};
  }
}

export async function getProductsAndLocations() {
  try {
    const [products, locations] = await Promise.all([
      prisma.product.findMany({
        select: { id: true, ean: true, name: true },
      }),
      prisma.warehouseLocation.findMany({
        select: { id: true, code: true, description: true },
      }),
    ]);
    return { products, locations };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Assign product to location
export async function assignProductToLocation(prevState, formData) {
  const prisma = new PrismaClient();
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
  } finally {
    await prisma.$disconnect();
  }
}

// Location Actions
export async function createLocation(prevState, formData) {
  let prisma;
  try {
    // Initialize Prisma client
    prisma = new PrismaClient();

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
  } finally {
    // Close connection if it was opened
    if (prisma) {
      await prisma.$disconnect().catch((e) => {
        console.error('Error disconnecting Prisma:', e);
      });
    }
  }
}

// In app/warehouse/actions.js
export async function createProduct(prevState, formData) {
  try {
    // Validate form data exists
    if (!formData) {
      throw new Error('Form data is required');
    }

    // Get and validate required fields
    const ean = formData.get('ean');
    const name = formData.get('name');

    if (!ean || !name) {
      throw new Error('EAN and Name are required fields');
    }

    // Get optional fields
    const description = formData.get('description') || null;
    const imageUrl = formData.get('imageUrl') || null;

    // Create the product
    const product = await prisma.product.create({
      data: {
        ean,
        name,
        description,
      },
    });

    // Create image record if URL provided
    if (imageUrl) {
      await prisma.images.upsert({
        where: { ean },
        update: { image: imageUrl },
        create: { ean, image: imageUrl },
      });
    }

    revalidatePath('/warehouse');
    return {
      success: true,
      message: 'Product created successfully',
      product,
    };
  } catch (error) {
    console.error('Product creation error:', {
      message: error.message,
      stack: error.stack,
      formData: formData ? Object.fromEntries(formData) : null,
    });
    return {
      success: false,
      error: error.message,
      message: `Failed to create product: ${error.message}`,
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

    // Create a history record (optional)
    // You might want to add this if you're tracking changes
    // await prisma.productLocationHistory.create({
    //   data: {
    //     recordId: productLocationId,
    //     userId: 'system', // You might want to pass the actual user ID
    //     action: 'DELETE',
    //     field: 'product_location',
    //     oldValue: JSON.stringify(productLocation),
    //     newValue: null,
    //   },
    // });

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

    // Fetch images for these products
    const productImages = {};
    if (eans.length > 0) {
      const images = await prisma.images.findMany({
        where: {
          ean: {
            in: eans,
          },
        },
      });

      // Create a mapping of EAN to image
      images.forEach((image) => {
        productImages[image.ean] = image.image;
      });
    }

    return {
      location: {
        id: location.id,
        code: location.code,
        description: location.description,
      },
      products: location.products,
      productImages, // Include the images in the response
    };
  } catch (error) {
    return { error: error.message };
  }
}

export async function scanProduct(prevState, formData) {
  const prisma = new PrismaClient();
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
            },
          },
        },
      },
    });

    if (!product) {
      return { error: 'Product not found' };
    }

    // Then get the image separately
    const image = await prisma.images.findUnique({
      where: { ean: productEan },
    });

    return {
      product: {
        id: product.id,
        ean: product.ean,
        name: product.name,
        description: product.description,
        imageUrl: image?.image || null,
      },
      locations: product.locations.map((loc) => ({
        ...loc,
        history: loc.history.map((hist) => ({
          ...hist,
          // Add username if you need it (requires proper relation)
          username: 'System', // Placeholder until you set up proper user relations
        })),
      })),
    };
  } catch (error) {
    console.error('Product scan error:', error);
    return { error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Modification Actions
export async function updateProductQuantity(prevState, formData) {
  try {
    const user = await getCurrentUser();
    if (!user?.name) throw new Error('User authentication failed');

    const assignmentId = formData.get('assignmentId');
    const newQuantity = parseInt(formData.get('newQuantity'));

    if (isNaN(newQuantity)) throw new Error('Invalid quantity');

    const result = await prisma.$transaction([
      prisma.productLocation.update({
        where: { id: assignmentId },
        data: { quantity: newQuantity },
        include: { product: true, location: true },
      }),
      prisma.productLocationHistory.create({
        data: {
          recordId: assignmentId,
          action: 'UPDATE',
          field: 'quantity',
          oldValue: prevState?.currentQuantity?.toString() || '0',
          newValue: newQuantity.toString(),
          userId: user.name,
        },
      }),
    ]);

    return {
      success: true,
      updatedAssignment: result,
      newQuantity: newQuantity,
      currentQuantity: newQuantity,
    };
  } catch (error) {
    return { error: error.message };
  }
}

export async function moveProductLocation(prevState, formData) {
  try {
    // Verify Prisma client is available
    if (!prisma) throw new Error('Prisma client not initialized');

    const user = await getCurrentUser();
    if (!user?.name) throw new Error('User authentication failed');

    const assignmentId = formData.get('assignmentId');
    const newLocationId = formData.get('locationCode');

    if (!assignmentId) throw new Error('Missing assignment ID');
    if (!newLocationId) throw new Error('Missing new location ID');

    // Verify the new location exists
    const locationExists = await prisma.warehouseLocation.findUnique({
      where: { code: newLocationId },
    });
    if (!locationExists) throw new Error('Location not found');

    // Transaction for atomic updates
    const [updatedAssignment] = await prisma.$transaction([
      prisma.productLocation.update({
        where: { id: assignmentId },
        data: { locationId: newLocationId },
        include: {
          product: true,
          location: true,
        },
      }),
      prisma.productLocationHistory.create({
        data: {
          recordId: assignmentId,
          action: 'MOVE',
          field: 'location',
          oldValue: prevState?.currentLocationId,
          newValue: newLocationId,
          userId: user.name,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Location updated successfully',
      updatedAssignment,
    };
  } catch (error) {
    console.error('Move location error:', error);
    return {
      error: error.message || 'Failed to move product location',
      details: error,
    };
  }
}
// Example function to get total product quantity
export async function getProductTotalQuantity(productId) {
  const locations = await prisma.locationProduct.findMany({
    where: { productId },
    select: { quantity: true },
  });

  return locations.reduce((total, loc) => total + loc.quantity, 0);
}
// Data Fetching Actions
export async function getProducts() {
  return await prisma.product.findMany({
    select: { id: true, ean: true, name: true },
  });
}

export async function getLocations() {
  try {
    const prisma = new PrismaClient();
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
    await prisma.$disconnect();
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}
