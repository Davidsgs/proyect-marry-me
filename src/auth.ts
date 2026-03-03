import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import whitelistData from "./whitelist.json"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user?.email;
                if (email) {
                    try {
                        const whitelist: string[] = whitelistData;
                        if (whitelist.includes(email)) {
                            return true;
                        }
                    } catch (e) {
                        console.error("Error reading whitelist", e);
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
