'use server';
import { DateTime } from 'luxon';
import { prisma } from '../../prisma.js';

// Constants and configuration
const BOL_API_BASE = process.env.BOLAPI;
const DEFAULT_IMAGE = '/no_image.jpg';
const IMAGE_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Cache implementation with TTL
class TTLCache {
  constructor(ttl = IMAGE_CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }
}

const imageCache = new TTLCache();

// Helper functions with validation - FIXED: Added email field
const extractAddressDetails = (details, prefix, includeEmail = false) => {
  const baseFields = {
    [`${prefix}_salutationCode`]: details?.salutation || null,
    [`${prefix}_firstName`]: details?.firstName || '',
    [`${prefix}_surname`]: details?.surname || '',
    [`${prefix}_streetName`]: details?.streetName || '',
    [`${prefix}_houseNumber`]: details?.houseNumber || '',
    [`${prefix}_houseNumberExtension`]: details?.houseNumberExtension || null,
    [`${prefix}_zipCode`]: details?.zipCode || '',
    [`${prefix}_city`]: details?.city || '',
    [`${prefix}_countryCode`]: details?.countryCode || '',
  };

  // Add email only for shipment details
  if (includeEmail) {
    baseFields.email = details?.email || '';
    baseFields.language = details?.language || '';
  }

  // Add company only for billing details
  if (prefix === 'b') {
    baseFields.b_company = details?.company || null;
  }

  return baseFields;
};

const extractShipmentDetails = (details) =>
  extractAddressDetails(details, 's', true);
const extractBillingDetails = (details) =>
  extractAddressDetails(details, 'b', false);

const extractFulfillmentDetails = (fulfilment) => ({
  latestDeliveryDate: fulfilment?.latestDeliveryDate
    ? DateTime.fromISO(fulfilment.latestDeliveryDate).toISO()
    : null,
  exactDeliveryDate: fulfilment?.exactDeliveryDate
    ? DateTime.fromISO(fulfilment.exactDeliveryDate).toISO()
    : null,
  expiryDate: fulfilment?.expiryDate
    ? DateTime.fromISO(fulfilment.expiryDate).toISO()
    : null,
  offerCondition: fulfilment?.offerCondition || null,
  cancelRequest: fulfilment?.cancelRequest ? 'true' : 'false',
  method: fulfilment?.method || '',
  distributionParty: fulfilment?.distributionParty || '',
});

// Token management with caching
const tokenCache = new TTLCache(1000 * 60 * 5); // 5 minutes TTL for tokens

export const Token = async (account) => {
  if (!account) throw new Error('Account is required');

  const cacheKey = `token:${account}`;
  const cachedToken = tokenCache.get(cacheKey);
  if (cachedToken) return cachedToken;

  const response = await fetch('https://ampx.nl/token.php', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account }),
  });

  if (!response.ok) throw new Error('Token request failed');

  const result = await response.json();
  const tokenData = { token: result, account };

  tokenCache.set(cacheKey, tokenData);
  return tokenData;
};

// Database operations
const AddDBImage = async (ean, image) => {
  await prisma.images.upsert({
    where: { ean },
    update: { image },
    create: { ean, image },
  });
};

const AddDBOrders = async (ordersData) => {
  if (!ordersData.length) return;

  await prisma.$transaction(
    ordersData.map((data) =>
      prisma.orders.upsert({
        where: { orderItemId: data.orderItemId },
        update: {},
        create: data,
      })
    )
  );
};

// Image handling with better error management
export const OrderImg = async (ean, account) => {
  if (!ean) return DEFAULT_IMAGE;

  const cachedImage = imageCache.get(ean);
  if (cachedImage) return cachedImage;

  try {
    const dbImage = await prisma.images.findFirst({ where: { ean } });
    if (dbImage) {
      imageCache.set(ean, dbImage.image);
      return dbImage.image;
    }

    const { token } = await Token(account);
    const response = await fetch(
      `${BOL_API_BASE}retailer/products/${ean}/assets`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.retailer.v10+json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return DEFAULT_IMAGE;

    const images = await response.json();
    const imageUrl = images.assets[0]?.variants[1]?.url || DEFAULT_IMAGE;

    await AddDBImage(ean, imageUrl);
    imageCache.set(ean, imageUrl);

    return imageUrl;
  } catch (error) {
    console.error(`Image fetch failed for EAN ${ean}:`, error);
    return DEFAULT_IMAGE;
  }
};

// Order processing with improved error handling
const processOrderItem = async (item, order, account) => {
  const ean = item.product?.ean;
  if (!ean) {
    console.warn('Missing EAN for item:', item.orderItemId);
    return null;
  }

  try {
    const [image] = await Promise.all([
      OrderImg(ean, account).catch(() => DEFAULT_IMAGE),
    ]);

    return {
      orderId: order.orderId,
      orderItemId: item.orderItemId,
      account,
      dateTimeOrderPlaced: order.orderPlacedDateTime,
      ...extractShipmentDetails(order.shipmentDetails),
      ...extractBillingDetails(order.billingDetails),
      offerId: item.offer?.offerId || '',
      ean,
      title: item.product?.title || 'Unknown Product',
      img: image,
      url: `https://www.bol.com/nl/nl/s/?searchtext=${ean}`,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      commission: item.commission || 0,
      ...extractFulfillmentDetails(item.fulfilment),
      fulfilled: '',
      qls_time: DateTime.now().toISO(),
    };
  } catch (error) {
    console.error(`Error processing item ${item.orderItemId}:`, error);
    return null;
  }
};

export const OrderBol = async (orderId, account) => {
  if (!orderId?.trim()) throw new Error('Invalid order ID');
  if (!account?.trim()) throw new Error('Invalid account');

  try {
    // Check for existing orders
    const existingOrders = await prisma.orders.findMany({
      where: { orderId },
    });

    if (existingOrders.length > 0) return existingOrders;

    // Fetch order details
    const { token } = await Token(account);
    const response = await fetch(`${BOL_API_BASE}retailer/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const order = await response.json();
    if (!order?.orderItems?.length) return [];

    // Process items in parallel with error handling
    const processingResults = await Promise.allSettled(
      order.orderItems.map((item) => processOrderItem(item, order, account))
    );

    const validItems = processingResults
      .filter(
        (result) => result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value);

    // Bulk insert valid items
    if (validItems.length > 0) {
      await AddDBOrders(validItems);
    }

    return validItems;
  } catch (error) {
    console.error('OrderBol error:', {
      error: error.message,
      orderId,
      account,
      timestamp: DateTime.now().toISO(),
    });
    throw error;
  }
};

// Batch order processing
// In your actions.js - update the ComboOrders function
export const ComboOrders = async (page, account) => {
  if (!account?.trim()) throw new Error('Invalid account');

  try {
    const { token } = await Token(account);
    const response = await fetch(
      `${BOL_API_BASE}retailer/orders?page=${page}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.retailer.v10+json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      // More specific error messages based on status code
      const errorMessage = await getErrorMessage(response);
      throw new Error(`Failed to fetch orders: ${errorMessage}`);
    }

    const data = await response.json();

    // Handle case where orders array exists but is empty
    if (!data.orders || data.orders.length === 0) {
      return [];
    }

    // Process orders in parallel with error handling
    const orderDetails = await Promise.allSettled(
      data.orders.map((order) => OrderBol(order.orderId, account))
    );

    return data.orders.map((order, index) => ({
      orderId: order.orderId,
      details:
        orderDetails[index].status === 'fulfilled'
          ? orderDetails[index].value
          : [],
    }));
  } catch (error) {
    console.error('ComboOrders error:', {
      error: error.message,
      page,
      account,
      timestamp: DateTime.now().toISO(),
    });

    // Re-throw with more context
    throw new Error(`ComboOrders failed for page ${page}: ${error.message}`);
  }
};

async function getErrorMessage(response) {
  try {
    const errorData = await response.json();
    return errorData?.detail || errorData?.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status} - ${response.statusText}`;
  }
}

// Simple utilities (unchanged as they're already minimal)
export const LabelQLS = async (odr) => {
  return 'https://api.pakketdienstqls.nl/pdf/labels/d6658315-1992-45fb-8abe-5461c771778f.pdf?token=f546c271-10a1-49a7-a7e6-de53c9c6727a&size=a6';
};

export const SubmitForm = async (value) => {
  console.log('Form submitted:', value);
  return { success: true, message: 'Form submitted successfully' };
};

// Helper: fetch unfulfilled orders
async function getPendingOrders(account = 'NL', page = 1, perPage = 4000) {
  const skip = (page - 1) * perPage;

  return prisma.orders.findMany({
    where: {
      OR: [{ fulfilled: '' }, { fulfilled: null }],
      account,
    },
    orderBy: { dateTimeOrderPlaced: 'desc' },
    skip,
    take: perPage,
  });
}
