import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import GitHubProvider from 'next-auth/providers/github';
//import { PrismaClient } from '@prisma/client'
//import { PrismaAdapter } from '@auth/prisma-adapter'

//const prisma = new PrismaClient()
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [GitHub],
  // adapter: PrismaAdapter(prisma),
  trustHost: true,
});

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      session.user.id = token.sub || token.id || user.id;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
