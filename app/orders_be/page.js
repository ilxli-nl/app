import { auth } from '@/auth';
import { SignInButton } from '../components/sign-in-button';
import { prisma } from '@/prisma';
import InfiniteOrders from '../components/InfiniteOrders';
import Paginations from '../components/pagination';
import BpostOrderForm from '../components/LabelForm';

const Database = async ({ searchParams }) => {
  const session = await auth();

  const page = await searchParams['page'];
  const account = 'BE';

  if (session?.user.name == 'ilxli-nl') {
    return (
      <div>
        <Paginations />

        <BpostOrderForm />
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
