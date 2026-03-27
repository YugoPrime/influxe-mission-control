import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || 'mission-control-dev-secret-change-in-prod',
  pages: {
    signIn: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
