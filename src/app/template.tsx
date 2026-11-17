"use client";

import { ViewTransition } from "react";

// Fundido suave al cambiar de página (portada, login, invitación, panel).
// Next vuelve a montar el template en cada navegación: el contenido anterior sale
// (page-out) y el nuevo entra (page-in). default="none": las actualizaciones
// dentro de una misma página (guardar, filtrar) no se animan. Estilos y
// «menos movimiento» en globals.css.
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <ViewTransition enter="page-in" exit="page-out" default="none">
            {children}
        </ViewTransition>
    );
}
