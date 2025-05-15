import { auth } from '@/auth';
import { SignInButton } from '@/components/sign-in-button';
import { prisma } from '@/prisma';
import InfiniteOrders from '@/components/InfiniteOrders';
import Paginations from '@/components/pagination';

const Database = async ({ searchParams }) => {
  const session = await auth();

  const page = await searchParams['page'];
  const account = 'NL_NEW';

  const users = await prisma.user.findMany();

  if (session?.user.name == 'ilxli-nl') {
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
        <InfiniteOrders page={page} account={account} />
        <Paginations />
      </div>
    );
  }
  return (
    <div>
      <p> You Are Not Signed In</p> <SignInButton />
    </div>
  );
};
export default Database;
