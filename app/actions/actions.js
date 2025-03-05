'use server';
const { DateTime } = require('luxon');

import { prisma } from '@/prisma';

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

  return result;
};

//const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const Orders = async (page) => {
  const token = await Token();
  const response = await fetch(`${process.env.BOLAPI}retailer/orders`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.retailer.v10+json',
      Authorization: 'Bearer ' + token,
    },
  });

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

export const OrderImg = async (ean) => {
  const imgFromDB = await prisma.images.findFirst({
    where: {
      ean,
    },
  });
  if (imgFromDB) {
    const imgFrDB = imgFromDB.image;

    console.log('IMage form DB');
    AddDBImage(ean, imgFrDB);
    return imgFrDB;
  } else {
    const token = await Token();

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
    console.log('IMage form BOL');
    AddDBImage(ean, img);

    return img;
  }
};

export const AddDB = async (order, img) => {
  //console.dir(order.orderItems);
  const ean = order.orderItems[0].product.ean;
  // const img = await OrderImg(ean);
  const url = `https://www.bol.com/nl/nl/s/?searchtext=${ean}`;

  for (const i in order.orderItems) {
    await prisma.orders.upsert({
      where: { orderItemId: order.orderItems[i].orderItemId },
      update: {
        cancelRequest: order.orderItems[i].cancelRequest,
      },
      create: {
        orderId: order.orderId,
        orderItemId: order.orderItems[i].orderItemId,
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
        offerId: order.orderItems[i].offer.offerId,
        ean: ean,
        title: order.orderItems[i].product.title,
        img: img,
        url: url,
        quantity: order.orderItems[i].quantity,
        unitPrice: order.orderItems[i].unitPrice,
        commission: order.orderItems[i].commission,
        latestDeliveryDate: DateTime.fromISO(
          order.orderItems[i].fulfilment.latestDeliveryDate
        ),
        exactDeliveryDate: DateTime.fromISO(
          order.orderItems[i].fulfilment.exactDeliveryDate
        ),
        expiryDate: DateTime.fromISO(order.orderItems[i].fulfilment.expiryDate),
        offerCondition: order.orderItems[i].offer.offerCondition,
        cancelRequest: order.orderItems[i].cancelRequest,
        method: order.orderItems[i].fulfilment.method,
        distributionParty: order.orderItems[i].fulfilment.distributionParty,
        fulfilled: '',
        qls_time: DateTime.fromISO(),
      },
    });
  }

  // await prisma.orders.create({
  //   data: {
  //     orderId: order.orderId,
  //     orderItemId: order.orderItems[0].orderItemId,
  //     account: 'NL',
  //     dateTimeOrderPlaced: order.orderPlacedDateTime,
  //     s_salutationCode: order.shipmentDetails.salutation,
  //     s_firstName: order.shipmentDetails.firstName,
  //     s_surname: order.shipmentDetails.surname,
  //     s_streetName: order.shipmentDetails.streetName,
  //     s_houseNumber: order.shipmentDetails.houseNumber,
  //     s_houseNumberExtended: order.shipmentDetails.houseNumberExtended,
  //     s_zipCode: order.shipmentDetails.zipCode,
  //     s_city: order.shipmentDetails.city,
  //     s_countryCode: order.shipmentDetails.countryCode,
  //     email: order.shipmentDetails.email,
  //     language: order.shipmentDetails.language,
  //     b_salutationCode: order.billingDetails.salutation,
  //     b_firstName: order.billingDetails.firstName,
  //     b_surname: order.billingDetails.surname,
  //     b_streetName: order.billingDetails.streetName,
  //     b_houseNumber: order.billingDetails.houseNumber,
  //     b_houseNumberExtended: order.billingDetails.houseNumberExtended,
  //     b_zipCode: order.billingDetails.zipCode,
  //     b_city: order.billingDetails.city,
  //     b_countryCode: order.billingDetails.countryCode,
  //     b_company: order.billingDetails.company,
  //     offerId: order.orderItems[0].offer.offerId,
  //     ean: ean,
  //     title: order.orderItems[0].product.title,
  //     img: img,
  //     url: url,
  //     quantity: order.orderItems[0].quantity,
  //     unitPrice: order.orderItems[0].unitPrice,
  //     commission: order.orderItems[0].commission,
  //     latestDeliveryDate: DateTime.fromISO(
  //       order.orderItems[0].fulfilment.latestDeliveryDate
  //     ),
  //     exactDeliveryDate: DateTime.fromISO(
  //       order.orderItems[0].fulfilment.exactDeliveryDate
  //     ),
  //     expiryDate: DateTime.fromISO(order.orderItems[0].fulfilment.expiryDate),
  //     offerCondition: order.orderItems[0].offer.offerCondition,
  //     cancelRequest: order.orderItems[0].cancelRequest,
  //     method: order.orderItems[0].fulfilment.method,
  //     distributionParty: order.orderItems[0].fulfilment.distributionParty,
  //     fulfilled: '',
  //     qls_time: DateTime.fromISO(),
  //   },
  // })

  //console.log(order)
};

export const OrderBol = async (odrId) => {
  // const ordersFromDB = await prisma.orders.findFirst({
  //   where: {
  //     odrId,
  //   },
  // });
  // if (ordersFromDB) {
  //   //const imgFrDB = imgFromDB.image;

  //   console.log(ordersFromDB);
  // }

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
  //await sleep(500);
  if (!response.ok) {
    return {};
  }
  AddDB(order);
  return order;
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
