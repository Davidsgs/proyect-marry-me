import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getUserPermissions } from "@/lib/permissions"

declare module "next-auth" {
    interface Session {
      user: {
        role: "ADMIN" | "MAIN_GUEST" | "GUEST";
        familyId: number | null;
        permissions: string[];
      } & DefaultSession["user"]
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== "google") {
                return false; // Only allow google
            }
            const email = user?.email;
            if (!email) {
                return false; // Return false to indicate access denied
            }

            try {
              const dbUser = await db.select().from(users).where(eq(users.email, email)).get();
              if (!dbUser) {
                  return false; // Not found in database means not invited / not registered
              }
              return true;
            } catch (e) {
              console.error(e);
              return false;
            }
        },
        async jwt({ token, user, trigger }) {
            // When user signs in, user object is available
            if (user?.email) {
                try {
                    const dbUser = await db.select().from(users).where(eq(users.email, user.email)).get();
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.familyId = dbUser.familyId;
                        token.permissions = await getUserPermissions(dbUser.id);
                    }
                } catch(e) {
                    console.error("JWT Error:", e);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as "ADMIN" | "MAIN_GUEST" | "GUEST";
                session.user.familyId = token.familyId as number | null;
                session.user.permissions = (token.permissions as string[]) || [];
            }
            return session;
        }
    },
    pages: {
        signIn: '/login', // Provide custom login page
        error: '/login', // Return users here on validation failure / whitelist rejection
    }
})

