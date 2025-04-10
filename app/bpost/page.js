import { auth } from '@/auth';
import { SignInButton } from '../components/sign-in-button';
import LabelForm from '../components/LabelForm';

const Bpost = async () => {
  const session = await auth();
  // console.log(users);
  if (session?.user.name == 'ilxli-nl') {
    return (
      <div>
        <LabelForm />
      </div>
    );
  }
  return (
    <div>
      <p> You Are Not Signed In</p> <SignInButton />
    </div>
  );
};
export default Bpost;
