"use client";

import { ViewTransition } from "react";

// Entre secciones del panel solo se funde el contenido: la barra lateral y la de
// navegación (en el layout) quedan quietas. Ver src/app/template.tsx.
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
    return (
        <ViewTransition enter="page-in" exit="page-out" default="none">
            {children}
        </ViewTransition>
    );
}
