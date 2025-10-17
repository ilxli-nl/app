// cron/orders-cron.js (Enhanced version with retries)
import 'dotenv/config';
import cron from 'node-cron';
import { DateTime } from 'luxon';
import { prisma } from '../prisma.js';
import { ComboOrders } from '../app/actions/actions.js';

// CONFIGURATION
const ACCOUNTS = ['NL', 'BE', 'NE_NEW'];
const MAX_PAGES = 3;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(account, page, retries = MAX_RETRIES) {
  try {
    return await ComboOrders(page, account);
  } catch (error) {
    if (retries > 0) {
      console.log(
        `🔄 Retrying page ${page} for ${account} (${retries} retries left)...`
      );
      await delay(RETRY_DELAY);
      return fetchWithRetry(account, page, retries - 1);
    }
    throw error;
  }
}

async function checkBolOrders() {
  console.log(
    `[${DateTime.now().toISO()}] 🔍 Checking for new BOL.com orders for accounts: ${ACCOUNTS.join(
      ', '
    )}...`
  );

  try {
    for (const account of ACCOUNTS) {
      console.log(`\n📋 ===== PROCESSING ACCOUNT: ${account} =====`);
      let totalNewOrders = 0;
      let totalUpdatedOrders = 0;

      for (let page = 1; page <= MAX_PAGES; page++) {
        try {
          console.log(`📄 Fetching page ${page} for account ${account}...`);
          const results = await fetchWithRetry(account, page);
          let newOrders = 0;
          let updatedOrders = 0;

          if (results && Array.isArray(results)) {
            for (const order of results) {
              const { details } = order;
              if (details?.length) {
                for (const data of details) {
                  const existingOrder = await prisma.orders.findUnique({
                    where: { orderItemId: data.orderItemId },
                  });

                  if (existingOrder) {
                    // Update existing order
                    await prisma.orders.update({
                      where: { orderItemId: data.orderItemId },
                      data: {
                        title: data.title,
                        quantity: data.quantity,
                        unitPrice: data.unitPrice,
                        latestDeliveryDate: data.latestDeliveryDate,
                        fulfilled: data.fulfilled,
                        qls_time: data.qls_time,
                        // Add other fields to update
                      },
                    });
                    updatedOrders++;
                  } else {
                    // Create new order
                    await prisma.orders.create({
                      data: {
                        ...data,
                        account: account,
                      },
                    });
                    newOrders++;
                  }
                }
                totalNewOrders += newOrders;
                totalUpdatedOrders += updatedOrders;
              }
            }
          }

          console.log(
            `✅ Page ${page} for ${account}: ${newOrders} new, ${updatedOrders} updated orders.`
          );

          // If no orders on this page, no need to check further pages
          if (results?.length === 0 && page > 1) {
            console.log(
              `⏭️  No more orders found for ${account}, moving to next account.`
            );
            break;
          }
        } catch (pageError) {
          console.error(
            `⚠️ Page ${page} failed for ${account}:`,
            pageError.message
          );
          continue;
        }
      }

      console.log(
        `📊 Account ${account} summary: ${totalNewOrders} new, ${totalUpdatedOrders} updated orders`
      );
      console.log(`📋 ===== FINISHED ACCOUNT: ${account} =====\n`);
    }
    console.log('🟢 Cron check completed for all accounts.');
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}

// Schedule job every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('⏰ Scheduled cron job triggered');
  await checkBolOrders();
});

// Run immediately when script starts
console.log('🚀 Starting initial order sync...');
await checkBolOrders();

// Keep the process alive
process.on('SIGINT', () => {
  console.log('👋 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});
