import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isAspNetIdentityHash, verifyAspNetIdentityPassword } from "@/lib/legacy-password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // Imported accounts keep their ASP.NET Core Identity hash (a
        // different format than bcrypt) until they successfully log in once,
        // at which point we transparently upgrade them to bcrypt.
        if (isAspNetIdentityHash(user.passwordHash)) {
          const valid = verifyAspNetIdentityPassword(password, user.passwordHash);
          if (!valid) return null;

          const passwordHash = await bcrypt.hash(password, 10);
          await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
        } else {
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.surname}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "ATHLETE";
      }
      return session;
    },
  },
});
