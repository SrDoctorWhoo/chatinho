import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { departments: { select: { id: true } } }
        });

        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentIds: user.departments.map(d => d.id)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        console.log('[AUTH DEBUG] User during login:', JSON.stringify(user));
        token.role = user.role;
        token.id = user.id;
        token.departmentIds = user.departmentIds;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.departmentIds = token.departmentIds;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
