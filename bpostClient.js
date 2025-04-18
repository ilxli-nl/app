// bpostClient.js

const soap = require('soap');

// Bpost API-configuratie
const wsdlUrl = 'https://api-parcel.bpost.be/services/shm?wsdl'; // Vervang dit door de juiste WSDL-URL
const username = '033209'; // Vervang dit door je Bpost-gebruikersnaam
const password = 'ioNigHtWiTatOrTHRemE'; // Vervang dit door je Bpost-wachtwoord

// Voorbeeldgegevens voor de bestelling
const orderData = {
  orderReference: 'ref_0123456789',
  receiver: {
    name: 'Alma van Appel',
    phoneNumber: '+32 2 641 13 90',
    emailAddress: 'alma@antidot.com',
    address: {
      streetName: 'Rue du Grand Duc',
      number: '13',
      postalCode: '1040',
      locality: 'Etterbeek',
      countryCode: 'BE',
    },
  },
  lines: [
    { description: 'Article description', quantity: 1 },
    { description: 'Some other articles', quantity: 5 },
  ],
  box: {
    product: 'bpack 24h Pro',
    options: {
      insurance: {
        type: 'ADDITIONAL_INSURANCE',
        amount: 'UP_TO_2500_EUROS',
      },
    },
  },
};

// Functie om een bestelling aan te maken via Bpost SOAP API
async function createBpostOrder(order) {
  try {
    // Maak de SOAP-client aan
    const client = await soap.createClientAsync(wsdlUrl);

    // Stel de authenticatie in
    client.setSecurity(new soap.BasicAuthSecurity(username, password));

    // Stel de parameters in voor de createOrReplaceOrder-aanroep
    const args = {
      order: {
        reference: order.orderReference,
        receiver: {
          name: order.receiver.name,
          phoneNumber: order.receiver.phoneNumber,
          emailAddress: order.receiver.emailAddress,
          address: {
            streetName: order.receiver.address.streetName,
            number: order.receiver.address.number,
            postalCode: order.receiver.address.postalCode,
            locality: order.receiver.address.locality,
            countryCode: order.receiver.address.countryCode,
          },
        },
        lines: order.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
        })),
        boxes: {
          box: {
            nationalBox: {
              product: order.box.product,
              options: {
                insurance: {
                  type: order.box.options.insurance.type,
                  amount: order.box.options.insurance.amount,
                },
              },
            },
          },
        },
      },
    };

    // Voer de createOrReplaceOrder-aanroep uit
    const [result] = await client.createOrReplaceOrderAsync(args);

    console.log('Bestelling succesvol aangemaakt:', result);
    return result;
  } catch (error) {
    console.error('Fout bij het aanmaken van de bestelling:', error);
    throw error;
  }
}

// Exporteer de functie voor gebruik in andere modules
module.exports = { createBpostOrder };
