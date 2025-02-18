import { auth } from '@/auth';
import { SignInButton } from './components/sign-in-button';

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    return (
      <>
        <div className='bg-slate-300 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
          <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
            <h1>Working</h1>
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
