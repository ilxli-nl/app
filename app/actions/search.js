'use server';

import { prisma } from '@/prisma';
export async function searchOrders(query) {
  // ...
  return await prisma.orders.findMany({
    where: {
      OR: [{ orderId: { contains: query, lte: 'insensitive' } }],
    },
    take: 10,
  });
}
