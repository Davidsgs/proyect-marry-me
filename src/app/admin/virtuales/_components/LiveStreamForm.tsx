"use client";

import { useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { setLiveStreamUrl } from "@/app/actions/virtual";
import { btnGhost, btnPrimary, inputCls } from "@/app/admin/_components/ui";
import { useNotify } from "@/app/admin/_components/Notice";
import { parseStreamUrl } from "@/lib/virtual";

// Enlace de la transmisión (event_config live_stream_url). Guardado optimista:
// si falla, vuelve el enlace anterior.
export default function LiveStreamForm({ initial, canWrite }: { initial: string; canWrite: boolean }) {
    const notify = useNotify();
    const [url, setUrl] = useState(initial);
    const [saved, setSaved] = useState(initial);
    const clean = url.trim();
    const invalid = clean !== "" && parseStreamUrl(clean) === null;
    const dirty = clean !== saved;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (invalid) return;
        const prev = saved;
        setSaved(clean);
        setLiveStreamUrl(clean)
            .then(() => notify(clean ? "Enlace de la transmisión publicado" : "Enlace de la transmisión quitado"))
            .catch(() => {
                setUrl(prev);
                setSaved(prev);
                notify("No se pudo guardar el enlace. Se deshizo el cambio.", "error");
            });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label htmlFor="live-url" className="block text-label font-medium text-on-surface-variant mb-1.5">Enlace (YouTube, Zoom, Instagram…)</label>
                <input
                    id="live-url"
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={!canWrite}
                    placeholder="https://youtube.com/live/…"
                    aria-invalid={invalid || undefined}
                    aria-describedby="live-url-hint"
                    className={inputCls}
                />
                <p id="live-url-hint" className={`mt-1.5 text-xs ${invalid ? "text-error" : "text-on-surface-variant"}`}>
                    {invalid ? "El enlace debe empezar con https://" : "Déjalo vacío hasta tener el enlace definitivo."}
                </p>
            </div>
            {canWrite && (
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    {saved && (
                        <a href={saved} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                            <ExternalLink className="w-4 h-4" aria-hidden />
                            Probar enlace
                        </a>
                    )}
                    <button type="submit" disabled={!dirty || invalid} className={btnPrimary}>
                        <Save className="w-4 h-4" aria-hidden />
                        Guardar enlace
                    </button>
                </div>
            )}
        </form>
    );
}
