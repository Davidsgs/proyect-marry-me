"use client";

import { useState, useEffect } from "react";

export default function Countdown() {
    const [timeLeft, setTimeLeft] = useState({
        days: -1,
        hours: -1,
        minutes: -1,
        seconds: -1,
    });

    useEffect(() => {
        // 3 de Abril de 2027 00:00:00 en UTC-3 (Argentina)
        const targetDate = new Date("2027-04-03T00:00:00-03:00").getTime();

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
        return <div className="h-24"></div>; // Placeholder para evitar desajustes de hidratación 
    }

    return (
        <div className="flex gap-4 sm:gap-8 justify-center items-center text-center">
            <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl md:text-8xl font-serif font-light text-wedding-cream drop-shadow-md">{timeLeft.days}</span>
                <span className="text-sm border-t border-wedding-blush-light/30 pt-2 mt-2 tracking-widest uppercase text-wedding-cream/80">Días</span>
            </div>
            <span className="text-2xl sm:text-4xl md:text-6xl font-light mb-8 text-wedding-blush-light/60">:</span>
            <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl md:text-8xl font-serif font-light text-wedding-cream drop-shadow-md">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-sm border-t border-wedding-blush-light/30 pt-2 mt-2 tracking-widest uppercase text-wedding-cream/80">Horas</span>
            </div>
            <span className="text-2xl sm:text-4xl md:text-6xl font-light mb-8 text-wedding-blush-light/60">:</span>
            <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl md:text-8xl font-serif font-light text-wedding-cream drop-shadow-md">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-sm border-t border-wedding-blush-light/30 pt-2 mt-2 tracking-widest uppercase text-wedding-cream/80">Minutos</span>
            </div>
            <span className="text-2xl sm:text-4xl md:text-6xl font-light mb-8 text-wedding-blush-light/60">:</span>
            <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl md:text-8xl font-serif font-light text-wedding-cream drop-shadow-md">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="text-sm border-t border-wedding-blush-light/30 pt-2 mt-2 tracking-widest uppercase text-wedding-cream/80">Segundos</span>
            </div>
        </div>
    );
}
