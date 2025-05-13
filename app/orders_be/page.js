import { auth } from '@/auth';
import { SignInButton } from '@/components/sign-in-button';
import OrdersBE from '@/components/OrdersBE';
import Paginations from '@/components/pagination';

const Database = async ({ searchParams }) => {
  const session = await auth();

  const page = await searchParams['page'];
  const account = 'BE';

  if (session?.user.name == 'ilxli-nl') {
    return (
      <div>
        <Paginations />

        <OrdersBE page={page} account={account} />

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
