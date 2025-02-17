'use server';

//import prisma from '@/lib/prisma';

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
  //await sleep(500);
  if (!response.ok) {
    return {};
  }
  // console.log(order);
  // await prisma.orders.create({
  //   data: {
  //     //     title,
  //     orderId: order.orderId,
  //     orderItemId: order.orderItems[0].orderItemId,
  //     account: 'NL',
  //     dateTimeOrderPlaced: order.orderPlacedDateTime,
  //   // s_salutationCode      String
  //   // s_firstName           String
  //   // s_surName             String
  //   // s_streetName          String
  //   // s_houseNumber         String
  //   // s_houseNumberExtended String?
  //   // s_zipCode             String
  //   // s_city                String
  //   // s_countryCode         String
  //   // email                 String
  //   // language              String
  //   // b_salutationCode      String?
  //   // b_firstName           String?
  //   // b_surName             String?
  //   // b_streetName          String?
  //   // b_houseNumber         String?
  //   // b_houseNumberExtended String?
  //   // b_zipCode             String?
  //   // b_city                String?
  //   // b_countryCode         String?
  //   // b_company             String?
  //   // offerId               String
  //   // ean                   String
  //   // title                 String
  //   // img                   String
  //   // url                   String
  //   // quantity              String
  //   // offerPrice            String
  //   // transactionFee        String?
  //   // latestDeliveryDate    DateTime?
  //   // exactDeliveryDate     DateTime?
  //   // expiryDate            DateTime?
  //   // offerCondition        String
  //   // cancelRequest         String?
  //   // fulfilmentMethod      String?
  //   // fulfilled             String?
  //   // qls_time              DateTime?
  //   },
  // });

  //console.log(order)
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
  //await sleep(500);
  //console.log(JSON.stringify(images, null, '  '))

  return images.assets[0].variants[1].url;
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
