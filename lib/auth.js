import { auth } from '@/auth';

export async function getCurrentUser() {
  try {
    const req = {
      headers: {},
      method: 'GET',
    };
    const res = {
      setHeader: () => {},
      end: () => {},
      statusCode: 200,
      body: {},
    };
    const session = await auth();

    if (!session?.user?.name) {
      console.error('No user ID in session:', session);
      return null;
    }

    return {
      id: session.user.name,
      email: session.user.email || `${session.user.id}@github.com`,
      name: session.user.name || session.user.login || 'GitHub User',
      image: session.user.image,
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}
