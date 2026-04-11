import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [GitHub],
  callbacks: {
    async signIn({ user, profile }) {
      // Store the GitHub login (globally unique) as the username
      if (profile?.login && user.id) {
        await db
          .update(users)
          .set({ username: profile.login as string })
          .where(eq(users.id, user.id));
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });
        session.user.username = dbUser?.username ?? "";
      }
      return session;
    },
  },
});
