import { auth } from '@/auth';
import { SignInButton } from '@/components/sign-in-button';

export default async function Home() {
  // const t = await ComboOrders(1, 'NL');
  // console.log(t);

  const account = 'NL';
  const page = 1;

  const session = await auth();
  if (session?.user.name == 'ilxli-nl') {
    return (
      <>
        <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
          <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
            <p>Working!</p>
          </main>
        </div>
      </>
    );
  }

  return (
    <div>
      <p> You Are Not Signed In</p> <SignInButton />
    </div>
  );
}
