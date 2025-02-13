import { prisma } from '@/prisma';
import InfiniteOrders from '../components/InfiniteOrders';
import InfiniteOrder from '../components/InfiniteOrder';

const Database = async () => {
  const users = await prisma.user.findMany();

  console.log(users);

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
      <InfiniteOrders />
    </div>
  );
};
export default Database;
