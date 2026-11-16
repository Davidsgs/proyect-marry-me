"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Check, AlertTriangle } from "lucide-react";

// Aviso breve tras guardar o fallar (región aria-live). Uso:
//   const notify = useNotify();  notify("Mesa guardada");  notify("No se pudo guardar", "error");
type Tone = "ok" | "error";
const NoticeContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function useNotify() {
    const ctx = useContext(NoticeContext);
    if (!ctx) throw new Error("useNotify debe usarse dentro de <NoticeProvider>");
    return ctx;
}

export function NoticeProvider({ children }: { children: React.ReactNode }) {
    const [notice, setNotice] = useState<{ id: number; message: string; tone: Tone } | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const notify = useCallback((message: string, tone: Tone = "ok") => {
        if (timer.current) clearTimeout(timer.current);
        setNotice({ id: Date.now(), message, tone });
        timer.current = setTimeout(() => setNotice(null), tone === "error" ? 6000 : 3000);
    }, []);

    return (
        <NoticeContext.Provider value={notify}>
            {children}
            <div
                role="status"
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 lg:bottom-8"
            >
                {notice && (
                    <p
                        key={notice.id}
                        className={`pointer-events-auto inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                            notice.tone === "error" ? "bg-error text-on-error" : "bg-tinta text-crema"
                        }`}
                    >
                        {notice.tone === "error" ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                        {notice.message}
                    </p>
                )}
            </div>
        </NoticeContext.Provider>
    );
}
