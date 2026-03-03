import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user?.email;
                if (email) {
                    const authorizedEmailsEnv = process.env.AUTHORIZED_EMAILS || "";
                    // Split by comma, trim whitespace, and filter out empty strings
                    const whitelist = authorizedEmailsEnv
                        .split(",")
                        .map((e) => e.trim())
                        .filter((e) => e.length > 0);

                    if (whitelist.includes(email)) {
                        return true;
                    }
                }
                return false; // Return false to indicate access denied
            }
            return false; // Only allow google
        },
    },
    pages: {
        signIn: '/login', // Provide custom login page
    }
})
