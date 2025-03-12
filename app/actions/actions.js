'use server';
const { DateTime } = require('luxon');

import { prisma } from '@/prisma';

const accountData = { account: 'NL' };

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

  let dat = {};

  dat.token = result;
  dat.account = account;

  console.log(dat);
  //return result;
  return dat;
};

//const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const Orders = async (page, account) => {
  // console.log('page :' + page);

  const tok = await Token(account);
  const token = tok.token;

  //const page = 1;
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

  const ordersall = await p.orders;

  return ordersall;
};

const AddDBImage = async (ean, image) => {
  await prisma.images.upsert({
    where: { ean },
    update: {
      ean,
      image,
    },
    create: {
      ean,
      image,
    },
  });

  return 'ok';
};

export const OrderImg = async (ean, account) => {
  const imgFromDB = await prisma.images.findFirst({
    where: {
      ean,
    },
  });
  if (imgFromDB) {
    const imgFrDB = imgFromDB.image;

    // console.log('IMage form DB');
    AddDBImage(ean, imgFrDB);
    return imgFrDB;
  } else {
    const tok = await Token(account);
    const token = tok.token;

    const response = await fetch(
      `${process.env.BOLAPI}retailer/products/${ean}/assets`, //?page=${page}${odrId}
      {
        cache: 'force-cache',
        // next: {
        //   revalidate: 9000,
        // },
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

    const img = images.assets[0].variants[1].url;
    //await sleep(500);

    AddDBImage(ean, img);

    return img;
  }
};

export const AddDB = async (data) => {
  await prisma.orders.upsert({
    where: { orderItemId: data.orderItemId }, // Make sure this is unique in Prisma
    update: {}, // No update logic yet
    create: data,
  });
};

export const OrderBol = async (odrId, account) => {
  const odrFromDB = await prisma.orders.findMany({
    where: {
      orderId: odrId,
    },
  });
  if (odrFromDB != '') {
    // console.dir(odrFromDB);
    return odrFromDB;
  }

  // const token = await Token(accountData.account);
  const tok = await Token(account);
  const token = tok.token;

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
  //await sleep(500);
  if (!response.ok) {
    return {};
  }

  // const items = order.orderItems;

  for (let item of order.orderItems) {
    const ean = item.product.ean;
    const img = await OrderImg(ean, account);
    const url = `https://www.bol.com/nl/nl/s/?searchtext=${ean}`;
    // console.log(order);
    const data = {
      orderId: order.orderId,
      orderItemId: item.orderItemId,
      account: accountData.account,
      dateTimeOrderPlaced: order.orderPlacedDateTime,
      s_salutationCode: order.shipmentDetails.salutation,
      s_firstName: order.shipmentDetails.firstName,
      s_surname: order.shipmentDetails.surname,
      s_streetName: order.shipmentDetails.streetName,
      s_houseNumber: order.shipmentDetails.houseNumber,
      s_houseNumberExtended: order.shipmentDetails.houseNumberExtended,
      s_zipCode: order.shipmentDetails.zipCode,
      s_city: order.shipmentDetails.city,
      s_countryCode: order.shipmentDetails.countryCode,
      email: order.shipmentDetails.email,
      language: order.shipmentDetails.language,
      b_salutationCode: order.billingDetails.salutation,
      b_firstName: order.billingDetails.firstName,
      b_surname: order.billingDetails.surname,
      b_streetName: order.billingDetails.streetName,
      b_houseNumber: order.billingDetails.houseNumber,
      b_houseNumberExtended: order.billingDetails.houseNumberExtended,
      b_zipCode: order.billingDetails.zipCode,
      b_city: order.billingDetails.city,
      b_countryCode: order.billingDetails.countryCode,
      b_company: order.billingDetails.company,
      offerId: item.offer.offerId,
      ean: ean,
      title: item.product.title,
      img: img,
      url: url,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      commission: item.commission,
      latestDeliveryDate: DateTime.fromISO(item.fulfilment.latestDeliveryDate),
      exactDeliveryDate: DateTime.fromISO(item.fulfilment.exactDeliveryDate),
      expiryDate: DateTime.fromISO(item.fulfilment.expiryDate),
      offerCondition: item.offer.offerCondition,
      cancelRequest: item.cancelRequest,
      method: item.fulfilment.method,
      distributionParty: item.fulfilment.distributionParty,
      fulfilled: '',
      qls_time: DateTime.now(), // Fixed: Use DateTime.now() instead
    };
    AddDB(data);

    //console.log(order.orderId + '|' + item.orderItemId + '|' + ean);
  }

  for (let item of order.orderItems) {
    const ean = item.product.ean;
    const img = await OrderImg(ean);
    const url = `https://www.bol.com/nl/nl/s/?searchtext=${ean}`;

    const returnData = {
      orderId: order.orderId,
      orderItemId: item.orderItemId,
      account: 'NL',
      dateTimeOrderPlaced: order.orderPlacedDateTime,
      s_salutationCode: order.shipmentDetails.salutation,
      s_firstName: order.shipmentDetails.firstName,
      s_surname: order.shipmentDetails.surname,
      s_streetName: order.shipmentDetails.streetName,
      s_houseNumber: order.shipmentDetails.houseNumber,
      s_houseNumberExtended: order.shipmentDetails.houseNumberExtended,
      s_zipCode: order.shipmentDetails.zipCode,
      s_city: order.shipmentDetails.city,
      s_countryCode: order.shipmentDetails.countryCode,
      email: order.shipmentDetails.email,
      language: order.shipmentDetails.language,
      b_salutationCode: order.billingDetails.salutation,
      b_firstName: order.billingDetails.firstName,
      b_surname: order.billingDetails.surname,
      b_streetName: order.billingDetails.streetName,
      b_houseNumber: order.billingDetails.houseNumber,
      b_houseNumberExtended: order.billingDetails.houseNumberExtended,
      b_zipCode: order.billingDetails.zipCode,
      b_city: order.billingDetails.city,
      b_countryCode: order.billingDetails.countryCode,
      b_company: order.billingDetails.company,
      offerId: item.offer.offerId,
      ean: ean,
      title: item.product.title,
      img: img,
      url: url,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      commission: item.commission,
      latestDeliveryDate: item.fulfilment.latestDeliveryDate,
      exactDeliveryDate: item.fulfilment.exactDeliveryDate,
      expiryDate: item.fulfilment.expiryDate,
      offerCondition: item.offer.offerCondition,
      cancelRequest: item.cancelRequest,
      method: item.fulfilment.method,
      distributionParty: item.fulfilment.distributionParty,
      fulfilled: '',
      qls_time: DateTime.now().toJSON(), // Fixed: Use DateTime.now() instead
    };

    //console.dir(data);

    return returnData;

    //return order;
  }
};

export const LabelQLS = async (odr) => {
  const basic =
    'Basic ' + Buffer.from(`${process.env.CRIDIT}`).toString('base64');

  //console.log(odr);
  //const basic = 'Basic ' + `${process.env.CRIDIT}`.toString('base64');

  // const qlsLabel = await fetch(
  //   `https://api.pakketdienstqls.nl/companies/${process.env.COMPANIES}/shipments`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       Authorization: basic,
  //       accept: '*/*',
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       weight: 100,
  //       reference: '123123213213',
  //       brand_id: '4ca8fd28-8a90-4b90-8f27-27f5bc74df5b',
  //       product_id: 1,
  //       product_combination_id: 1,
  //       cod_amount: 0,
  //       piece_total: 1,
  //       receiver_contact: {
  //         name: 'someName',
  //         companyname: '',
  //         street: 'SomeStreet',
  //         housenumber: '64',
  //         address_line: '',
  //         address2: '',
  //         postalcode: '3047AH',
  //         locality: 'Rotterdam',
  //         country: 'NL',
  //         email: 'Some@email.com',
  //       },
  //     }),
  //   }
  // )
  // const response = await qlsLabel.json()

  // const label = response.data.labels.a6;
  // console.log(response);

  const lab =
    'https://api.pakketdienstqls.nl/pdf/labels/d6658315-1992-45fb-8abe-5461c771778f.pdf?token=f546c271-10a1-49a7-a7e6-de53c9c6727a&size=a6';

  return lab;

  //return 'Working'
};
