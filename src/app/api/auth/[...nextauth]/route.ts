import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      // If no allowlist configured, allow any Google sign-in
      if (ALLOWED_EMAILS.length === 0) return true
      return ALLOWED_EMAILS.includes(user.email || '')
    },
    async session({ session, token }) {
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
