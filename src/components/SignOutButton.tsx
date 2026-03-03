import { signOut } from "@/auth";

export function SignOutButton() {
    return (
        <form
            action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
            }}
        >
            <button
                type="submit"
                className="px-4 py-2 bg-wedding-sage-light/20 text-wedding-sage-darkest rounded-md hover:bg-wedding-sage-light/40 transition-colors text-sm font-medium border border-wedding-sage-light/30 backdrop-blur-sm shadow-sm"
            >
                Cerrar Sesión
            </button>
        </form>
    );
}
