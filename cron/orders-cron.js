// cron/orders-cron.js
import 'dotenv/config';
import cron from 'node-cron';
import { DateTime } from 'luxon';
import { prisma } from '../prisma.js';
import { ComboOrders } from '../app/actions/actions.js'; // Adjust path if needed

// CONFIGURATION
const ACCOUNTS = process.env.BOL_ACCOUNTS?.split(',') || []; // Example: "account1,account2"
const MAX_PAGES = 3; // how many pages of orders to fetch each time

async function checkBolOrders() {
  console.log(
    `[${DateTime.now().toISO()}] 🔍 Checking for new BOL.com orders...`
  );

  try {
    for (const account of ACCOUNTS) {
      console.log(`Fetching for account: ${account}`);

      for (let page = 1; page <= MAX_PAGES; page++) {
        try {
          const results = await ComboOrders(page, account);
          let newOrders = 0;

          for (const order of results) {
            const { details } = order;
            if (details?.length) {
              // Upsert each order like in your action
              await prisma.$transaction(
                details.map((data) =>
                  prisma.orders.upsert({
                    where: { orderItemId: data.orderItemId },
                    update: {},
                    create: data,
                  })
                )
              );
              newOrders += details.length;
            }
          }

          console.log(
            `✅ Page ${page} for ${account} completed. ${newOrders} orders processed.`
          );
        } catch (pageError) {
          console.error(
            `⚠️ Page ${page} failed for ${account}:`,
            pageError.message
          );
        }
      }
    }
    console.log('🟢 Cron check completed.');
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}

// Schedule job every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  await checkBolOrders();
});

// Run immediately when script starts
await checkBolOrders();
