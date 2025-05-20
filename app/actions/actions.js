'use server';
const { DateTime } = require('luxon');
import { prisma } from '@/prisma';

const accountData = { account: 'NL' };

// Helper functions
function extractShipmentDetails(details) {
  return {
    s_salutationCode: details?.salutation || null,
    s_firstName: details?.firstName || '',
    s_surname: details?.surname || '',
    s_streetName: details?.streetName || '',
    s_houseNumber: details?.houseNumber || '',
    s_houseNumberExtended: details?.houseNumberExtended || null,
    s_zipCode: details?.zipCode || '',
    s_city: details?.city || '',
    s_countryCode: details?.countryCode || '',
    email: details?.email || '',
    language: details?.language || '',
  };
}

function extractBillingDetails(details) {
  return {
    b_salutationCode: details?.salutation || null,
    b_firstName: details?.firstName || '',
    b_surname: details?.surname || '',
    b_streetName: details?.streetName || '',
    b_houseNumber: details?.houseNumber || '',
    b_houseNumberExtended: details?.houseNumberExtended || null,
    b_zipCode: details?.zipCode || '',
    b_city: details?.city || '',
    b_countryCode: details?.countryCode || '',
    b_company: details?.company || null,
  };
}

function extractFulfillmentDetails(fulfilment) {
  return {
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
  };
}

export const Token = async (account) => {
  const accountData = { account: account };

  const response = await fetch('https://ampx.nl/token.php', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
  const result = await response.json();

  return {
    token: result,
    account: account,
  };
};

export const Orders = async (page, account) => {
  const tok = await Token(account);
  const token = tok.token;

  const response = await fetch(
    `${process.env.BOLAPI}retailer/orders?page=${page}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );

  const p = await response.json();
  return p.orders || [];
};

const AddDBImage = async (ean, image) => {
  await prisma.images.upsert({
    where: { ean },
    update: { ean, image },
    create: { ean, image },
  });
  return 'ok';
};

const imageCache = new Map();

export const OrderImg = async (ean, account) => {
  if (imageCache.has(ean)) {
    return imageCache.get(ean);
  }

  const imgFromDB = await prisma.images.findFirst({ where: { ean } });

  if (imgFromDB) {
    imageCache.set(ean, imgFromDB.image);
    return imgFromDB.image;
  }

  const tok = await Token(account);
  const token = tok.token;

  const response = await fetch(
    `${process.env.BOLAPI}retailer/products/${ean}/assets`,
    {
      cache: 'force-cache',
      method: 'GET',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );

  if (!response.ok) {
    return '/no_image.jpg';
  }

  const images = await response.json();
  const img = images.assets[0]?.variants[1]?.url || '/no_image.jpg';

  await AddDBImage(ean, img);
  imageCache.set(ean, img);

  return img;
};

export const AddDB = async (data) => {
  await prisma.orders.upsert({
    where: { orderItemId: data.orderItemId },
    update: {},
    create: data,
  });
};

export const OrderBol = async (odrId, account) => {
  if (!odrId || typeof odrId !== 'string') {
    throw new Error('Invalid order ID');
  }
  if (!account || typeof account !== 'string') {
    throw new Error('Invalid account');
  }

  try {
    const existingOrders = await prisma.orders.findMany({
      where: { orderId: odrId },
    });

    if (existingOrders.length > 0) {
      return existingOrders;
    }

    const { token } = await Token(account);
    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    const response = await fetch(
      `${process.env.BOLAPI}retailer/orders/${odrId}`,
      {
        cache: 'force-cache',
        method: 'GET',
        headers: {
          Accept: 'application/vnd.retailer.v10+json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const order = await response.json();
    if (!order?.orderItems?.length) {
      return [];
    }

    const processingResults = await Promise.allSettled(
      order.orderItems.map(async (item) => {
        try {
          const ean = item.product?.ean;
          if (!ean) {
            console.warn('Missing EAN for item:', item.orderItemId);
            return null;
          }

          const [img] = await Promise.all([
            OrderImg(ean, account).catch((e) => {
              console.error(`Failed to get image for EAN ${ean}:`, e);
              return '/no_image.jpg';
            }),
          ]);

          const orderData = {
            orderId: order.orderId,
            orderItemId: item.orderItemId,
            account: account,
            dateTimeOrderPlaced: order.orderPlacedDateTime,
            ...extractShipmentDetails(order.shipmentDetails),
            ...extractBillingDetails(order.billingDetails),
            offerId: item.offer?.offerId || '',
            ean: ean,
            title: item.product?.title || 'Unknown Product',
            img: img,
            url: `https://www.bol.com/nl/nl/s/?searchtext=${ean}`,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            commission: item.commission || 0,
            ...extractFulfillmentDetails(item.fulfilment),
            fulfilled: '',
            qls_time: DateTime.now().toISO(),
          };

          return orderData;
        } catch (itemError) {
          console.error(
            `Error processing item ${item.orderItemId}:`,
            itemError
          );
          return null;
        }
      })
    );

    const validItems = processingResults
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => result.value);

    if (validItems.length > 0) {
      await prisma.$transaction(
        validItems.map((data) =>
          prisma.orders.upsert({
            where: { orderItemId: data.orderItemId },
            update: {},
            create: data,
          })
        )
      );
    }

    return validItems;
  } catch (error) {
    console.error('Error in OrderBol:', {
      error: error.message,
      orderId: odrId,
      account,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

export const LabelQLS = async (odr) => {
  const basic =
    'Basic ' + Buffer.from(`${process.env.CRIDIT}`).toString('base64');
  const lab =
    'https://api.pakketdienstqls.nl/pdf/labels/d6658315-1992-45fb-8abe-5461c771778f.pdf?token=f546c271-10a1-49a7-a7e6-de53c9c6727a&size=a6';
  return lab;
};

const submitForm = async (value) => {
  console.log('Form submitted: ', value);
  return { success: true, message: 'Form submitted successfully' };
};

export default submitForm;

/// working orders!

export const ComboOrders = async (page, account) => {
  const tok = await Token(account);
  const token = tok.token;

  const response = await fetch(
    `${process.env.BOLAPI}retailer/orders?page=${page}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );

  const p = await response.json();

  if (!p.orders) {
    return [];
  }

  // Process all orders in parallel
  const orderPromises = p.orders.map((odr) => OrderBol(odr.orderId, account));
  const orderDetails = await Promise.all(orderPromises);

  // Combine orderId with its details
  const result = p.orders.map((odr, index) => ({
    orderId: odr.orderId,
    details: orderDetails[index],
  }));
  return result;
};
