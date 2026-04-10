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
  events: {
    async createUser({ user }) {
      if (!user.id) return;

      // Derive username from the user's email prefix or name as fallback
      // The GitHub profile login will be set in the signIn callback below
      // This is just a fallback
      const base =
        user.name?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ?? "user";
      let username = base;

      const existing = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (existing) {
        username = `${base}-${Math.floor(Math.random() * 10000)}`;
      }

      await db
        .update(users)
        .set({ username })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    async signIn({ user, profile }) {
      // On sign-in, update username from GitHub login if not yet set or if
      // the createUser event set a fallback
      if (profile?.login && user.id) {
        const ghLogin = (profile.login as string).toLowerCase();
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        if (dbUser && (!dbUser.username || !dbUser.username.match(/^[a-z0-9-]+$/))) {
          let username = ghLogin;
          const collision = await db.query.users.findFirst({
            where: eq(users.username, username),
          });
          if (collision && collision.id !== user.id) {
            username = `${ghLogin}-${Math.floor(Math.random() * 10000)}`;
          }
          await db
            .update(users)
            .set({ username })
            .where(eq(users.id, user.id));
        }
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
