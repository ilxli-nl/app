'use server';
//import { unstable_cacheLife as cacheLife } from 'next/cache';

export const Token = async () => {
  const accountData = { account: 'NL' };

  const response = await fetch('https://ampx.nl/token.php', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });

  const result = await response.json();

  //console.log(result);

  return result;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const Orders = async (page) => {
  const token = await Token();
  const response = await fetch(
    `${process.env.BOLAPI}retailer/orders`, //?page=${page}
    {
      // cache: 'force-cache',
      // next: {
      //   revalidate: 9000,
      // },
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );
  // if (!response.ok) {
  //   throw new Error('Failed to fetch orders');
  // }

  const p = await response.json();

  const ordersall = await p.orders;

  return ordersall;
};

export const OrderBol = async (odrId) => {
  const token = await Token();

  const response = await fetch(
    `${process.env.BOLAPI}retailer/orders/${odrId}`, //?page=${page}${odrId}
    {
      cache: 'force-cache',
      next: {
        revalidate: 9000,
      },
      method: 'GET',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );
  const order = await response.json();
  await sleep(500);
  if (!response.ok) {
    return {};
  }
  return order;
};

export const OrderImg = async (ean) => {
  const token = await Token();

  const response = await fetch(
    `${process.env.BOLAPI}retailer/products/${ean}/assets`, //?page=${page}${odrId}
    {
      cache: 'force-cache',
      next: {
        revalidate: 9000,
      },
      method: 'GET',
      headers: {
        Accept: 'application/vnd.retailer.v10+json',
        Authorization: 'Bearer ' + token,
      },
    }
  );

  if (!response.ok) {
    // throw new Error('Failed to fetch order');
    return '/no_image.jpg';
  }

  const images = await response.json();
  await sleep(500);
  //console.log(JSON.stringify(images, null, '  '))

  return images.assets[0].variants[1].url;
};

export const Label = async () => {
  const response = await fetch(
    `https://ampx.nl/test.php`, //?page=${page}${odrId}
    {
      cache: 'no-cache',

      method: 'POST',
      headers: {},
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  //const html = await response.json();
  const html = response;

  //console.log(JSON.stringify(images, null, '  '))

  return html;
};
