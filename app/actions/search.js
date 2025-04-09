'use server';

import { prisma } from '@/prisma';
export async function searchOrders(query) {
  // ...
  return await prisma.orders.findMany({
    where: {
      OR: [
        { orderId: { contains: query, lte: 'insensitive' } },

        { title: { contains: query } },
        { s_zipCode: { contains: query, lte: 'insensitive' } },
        { s_firstName: { contains: query, lte: 'insensitive' } },
        { s_surname: { contains: query, lte: 'insensitive' } },
      ],
    },
    take: 50,
  });
}
