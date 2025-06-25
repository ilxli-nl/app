import { authOptions } from './auth-config';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);

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

    // @ts-ignore
    const session = await handler(req, res);

    if (!session?.user?.id) {
      console.error('No user ID in session:', session);
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || `${session.user.id}@github.com`,
      name: session.user.name || session.user.login || 'GitHub User',
      image: session.user.image,
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}
