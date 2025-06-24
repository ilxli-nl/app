'use server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

import { PrismaClient } from '@prisma/client';

// Helper function to get current user (implement based on your auth system)
async function getCurrentUser() {
  return 'user-id-from-session';
}

// Get products and locations for dropdowns
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
  try {
    const productId = formData.get('productId');
    const locationId = formData.get('locationId');
    const quantity = parseInt(formData.get('quantity'));
    const userId = await getCurrentUser();

    // Check if assignment already exists
    const existingAssignment = await prisma.productLocation.findFirst({
      where: {
        productId,
        locationId,
      },
    });

    if (existingAssignment) {
      // Update quantity if exists
      await prisma.productLocation.update({
        where: { id: existingAssignment.id },
        data: { quantity: existingAssignment.quantity + quantity },
      });
    } else {
      // Create new assignment
      await prisma.productLocation.create({
        data: {
          productId,
          locationId,
          quantity,
        },
      });
    }

    // Create audit log
    await prisma.productLocationHistory.create({
      data: {
        recordId: existingAssignment?.id || 'new-assignment',
        userId,
        action: existingAssignment ? 'UPDATE' : 'CREATE',
        field: 'quantity',
        oldValue: existingAssignment?.quantity.toString() || '0',
        newValue: (existingAssignment
          ? existingAssignment.quantity + quantity
          : quantity
        ).toString(),
      },
    });

    revalidatePath('/warehouse');
    return { success: true };
  } catch (error) {
    console.error('Error assigning product:', error);
    return { error: error.message };
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

// Scanning Actions
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

    return {
      location: {
        id: location.id,
        code: location.code,
        description: location.description,
      },
      products: location.products,
    };
  } catch (error) {
    return { error: error.message };
  }
}

export async function scanProduct(prevState, formData) {
  try {
    const productEan = formData.get('productEan');

    const product = await prisma.product.findUnique({
      where: { ean: productEan },
      include: {
        locations: {
          include: {
            location: true,
            history: {
              include: { user: { select: { username: true } } },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    const image = await prisma.images.findUnique({
      where: { ean: productEan },
    });

    if (!product) return { error: 'Product not found' };

    return {
      product: {
        id: product.id,
        ean: product.ean,
        name: product.name,
        description: product.description,
        imageUrl: image?.image || null,
      },
      locations: product.locations,
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Modification Actions
export async function updateProductQuantity(prevState, formData) {
  try {
    const userId = await getCurrentUser();
    const assignmentId = formData.get('assignmentId');
    const newQuantity = parseInt(formData.get('newQuantity'));

    const current = await prisma.locationProduct.findUnique({
      where: { id: assignmentId },
      include: { product: true },
    });

    const quantityDiff = newQuantity - current.quantity;

    await prisma.locationProduct.update({
      where: { id: assignmentId },
      data: { quantity: newQuantity },
    });

    await prisma.product.update({
      where: { id: current.productId },
      data: { quantity: { increment: quantityDiff } },
    });

    await prisma.locationProductHistory.create({
      data: {
        recordId: assignmentId,
        userId,
        action: 'UPDATE',
        field: 'quantity',
        oldValue: current.quantity.toString(),
        newValue: newQuantity.toString(),
      },
    });

    revalidatePath('/warehouse');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function moveProductLocation(prevState, formData) {
  try {
    const userId = await getCurrentUser();
    const assignmentId = formData.get('assignmentId');
    const newLocationId = formData.get('newLocationId');

    const current = await prisma.locationProduct.findUnique({
      where: { id: assignmentId },
      include: { location: true, product: true },
    });

    const newLocation = await prisma.location.findUnique({
      where: { id: newLocationId },
    });

    const existing = await prisma.locationProduct.findFirst({
      where: {
        productId: current.productId,
        locationId: newLocationId,
      },
    });

    if (existing) {
      await prisma.locationProduct.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + current.quantity },
      });

      await prisma.locationProduct.delete({
        where: { id: assignmentId },
      });
    } else {
      await prisma.locationProduct.update({
        where: { id: assignmentId },
        data: { locationId: newLocationId },
      });
    }

    await prisma.locationProductHistory.create({
      data: {
        recordId: assignmentId,
        userId,
        action: 'MOVE',
        field: 'location',
        oldValue: current.location.code,
        newValue: newLocation.code,
      },
    });

    revalidatePath('/warehouse');
    return { success: true };
  } catch (error) {
    return { error: error.message };
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
