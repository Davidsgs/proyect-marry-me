"use client" // Error boundaries must be Client Components

import { useEffect, useState } from "react"
import { Pinyon_Script } from 'next/font/google';

const pinyonScript = Pinyon_Script({
    weight: "400",
    subsets: ["latin"],
});

type Translations = {
    [key: string]: {
        title: string;
        description: string;
        button: string;
        mailBody: string;
        mailSubject: string;
    }
}

const strings: Translations = {
    es: {
        title: "Algo salió mal",
        description: "Ponte en contacto con el equipo de soporte.",
        button: "Enviar correo a soporte",
        mailBody: "Hola, estoy teniendo un problema para ingresar a la pagina, dejo acá el detalle del error:",
        mailSubject: "Problema en la página - Error de sistema"
    },
    en: {
        title: "Something went wrong",
        description: "Please contact the support team.",
        button: "Email support",
        mailBody: "Hello, I am having a problem accessing the page, here is the error detail:",
        mailSubject: "Website problem - System Error"
    },
    pt: {
        title: "Algo deu errado",
        description: "Por favor, entre em contato com a equipe de suporte.",
        button: "Enviar e-mail para o suporte",
        mailBody: "Olá, estou tendo um problema para acessar a página, deixo aqui os detalhes do erro:",
        mailSubject: "Problema na página - Erro do sistema"
    }
}

export default function Error({
    error,
}: {
    error: Error & { digest?: string }
}) {
    const [lang] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const userLang = window.navigator.language.split('-')[0];
            if (strings[userLang]) {
                return userLang;
            }
        }
        return "es";
    });

    const currentStrings = strings[lang] || strings['es'];

    // Determine error payload to send
    const errorMessage = `${error.name}: ${error.message}\n\nStack:\n${error.stack || "No stack details"}`;

    // Mailto builder
    const mailSubject = encodeURIComponent(currentStrings.mailSubject);
    const mailBody = encodeURIComponent(`${currentStrings.mailBody}\n\n---\n${errorMessage}`);
    const mailToUrl = `mailto:soporte@davidyrocio.wedding?subject=${mailSubject}&body=${mailBody}`;

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-sage-darkest">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
                style={{ backgroundImage: "url('/background-placeholder.webp')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-wedding-sage-darkest/80 text-center"></div>

            <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-lg py-12 justify-center text-center">
                <h1 className={`${pinyonScript.className} text-6xl md:text-7xl text-wedding-blush-light drop-shadow-xl mb-4`}>
                    {currentStrings.title}
                </h1>

                <p className="text-xl text-wedding-cream mb-8 tracking-wide drop-shadow-md">
                    {currentStrings.description}
                </p>

                <div className="flex flex-col gap-4 w-full">
                    <a
                        href={mailToUrl}
                        className="w-full mt-2 px-4 py-3 bg-wedding-sage-light hover:brightness-110 text-wedding-sage-darkest font-medium rounded-md transition-all uppercase tracking-widest text-sm md:text-base shadow-lg cursor-pointer focus:ring-2 focus:ring-wedding-blush-light focus:outline-none flex items-center justify-center gap-3"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        {currentStrings.button}
                    </a>
                </div>
            </div>
        </main>
    )
}
