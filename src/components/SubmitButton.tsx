"use client"

import { useFormStatus } from "react-dom"

export function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="relative w-full mt-2 px-4 py-3 bg-wedding-sage-light hover:brightness-110 text-wedding-sage-darkest font-medium rounded-md transition-all uppercase tracking-widest text-sm md:text-base shadow-lg cursor-pointer focus:ring-2 focus:ring-wedding-sage-darkest focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-wedding-sage-darkest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                </span>
            ) : (
                "Continuar con Google"
            )}
        </button>
    )
}
