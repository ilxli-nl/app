//import { useState } from 'react';
import { prisma } from '@/prisma';
import InfiniteOrders from '../components/InfiniteOrders';
import Paginations from '../components/pagination';

const Database = async ({ searchParams }) => {
  const page = await searchParams['page'];

  const users = await prisma.user.findMany();

  // console.log(users);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
      <Paginations />
      <InfiniteOrders page={page} />
    </div>
  );
};
export default Database;
