"use client";

import { useState, useEffect } from "react";
import { WEDDING_DATE_ISO } from "@/lib/wedding";

export default function Countdown() {
    const [timeLeft, setTimeLeft] = useState({
        days: -1,
        hours: -1,
        minutes: -1,
        seconds: -1,
    });

    useEffect(() => {
        // 2 de abril de 2027 00:00:00 en UTC-3 (Argentina)
        const targetDate = new Date(WEDDING_DATE_ISO).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        // Render delays setting state by 1 tick to prevent synchronous state update in effect warning
        // while also ensuring hydration uses the initial -1 values.
        const timeout = setTimeout(updateTimer, 0);
        const timer = setInterval(updateTimer, 1000);

        return () => {
            clearTimeout(timeout);
            clearInterval(timer);
        };
    }, []);

    if (timeLeft.days === -1) {
        return <div className="h-28 sm:h-36" />; // Reserva el alto antes de hidratar
    }

    const units = [
        { value: String(timeLeft.days), label: timeLeft.days === 1 ? "día" : "días" },
        { value: String(timeLeft.hours).padStart(2, "0"), label: "horas" },
        { value: String(timeLeft.minutes).padStart(2, "0"), label: "minutos" },
        { value: String(timeLeft.seconds).padStart(2, "0"), label: "segundos" },
    ];

    return (
        <div
            role="timer"
            aria-label={`Faltan ${timeLeft.days} días, ${timeLeft.hours} horas y ${timeLeft.minutes} minutos`}
            className="flex justify-center items-start gap-2 sm:gap-6 text-center"
        >
            {units.map((u, i) => (
                <div key={u.label} className="flex items-start gap-2 sm:gap-6">
                    {i > 0 && (
                        <span aria-hidden className="font-sans font-light text-3xl sm:text-5xl md:text-7xl leading-none text-rubor/60">:</span>
                    )}
                    <div className="flex flex-col items-center min-w-[3.75rem] sm:min-w-24">
                        {/* Cifras en Mulish ligera con numerales tabulares (no saltan al cambiar). */}
                        {/* key = valor: solo la cifra que cambia vuelve a entrar (suave, desde arriba). */}
                        <span key={u.value} aria-hidden className="font-sans font-light tabular-nums text-4xl sm:text-6xl md:text-7xl leading-none text-crema animate-in fade-in slide-in-from-top-1 duration-500 motion-reduce:animate-none">{u.value}</span>
                        <span aria-hidden className="mt-3 font-text text-sm sm:text-base text-crema/85">{u.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
