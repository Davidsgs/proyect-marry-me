"use client";

import { useSyncExternalStore } from "react";
import { WEDDING_DATE_ISO } from "@/lib/wedding";

const AR_TZ = "America/Argentina/Buenos_Aires";
const noop = () => () => {};

// Hora de la ceremonia en la zona del visitante («sábado 3 de abril, 02:00»), solo
// si no está en la hora de Argentina. Se calcula en el navegador: el servidor no
// sabe dónde está quien mira (en el HTML del servidor no se muestra nada).
function localLabel(): string | null {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start = new Date(WEDDING_DATE_ISO);
    const fmt = (timeZone: string) =>
        new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(start);
    const here = fmt(tz);
    return here === fmt(AR_TZ) ? null : here;
}

export default function LocalTime({ className = "" }: { className?: string }) {
    const label = useSyncExternalStore(noop, localLabel, () => null);
    if (!label) return null;
    return <p className={className}>En tu zona horaria: <span className="font-semibold">{label} h</span></p>;
}
