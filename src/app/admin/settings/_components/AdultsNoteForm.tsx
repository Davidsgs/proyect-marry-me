"use client";

import { useState } from "react";
import { GrowText } from "@/components/GrowText";
import { setConfig } from "@/app/actions/config";
import { RotateCcw, Save } from "lucide-react";
import { btnGhost, btnPrimary, inputCls } from "@/app/admin/_components/ui";
import { useNotify } from "@/app/admin/_components/Notice";
import AdultsNote from "@/app/dashboard/_components/AdultsNote";
import { ADULTS_NOTE_DEFAULT, ADULTS_NOTE_MAX } from "@/lib/wedding";

// Texto de la nota sobre niños (clave adults_note). Vacío = texto por defecto.
// Guardado optimista: si falla, vuelve el texto anterior.
export default function AdultsNoteForm({ initial }: { initial: string }) {
  const notify = useNotify();
  const [text, setText] = useState(initial || ADULTS_NOTE_DEFAULT);
  const [saved, setSaved] = useState(initial || ADULTS_NOTE_DEFAULT);
  const dirty = text.trim() !== saved.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim() || ADULTS_NOTE_DEFAULT;
    const prev = saved;
    setText(clean);
    setSaved(clean);
    // Si es el texto por defecto se guarda vacío, así un cambio futuro del texto base se aplica solo.
    setConfig("adults_note", clean === ADULTS_NOTE_DEFAULT ? "" : clean)
      .then(() => notify("Nota sobre niños guardada"))
      .catch(() => {
        setText(prev);
        setSaved(prev);
        notify("No se pudo guardar la nota sobre niños. Se deshizo el cambio.", "error");
      });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="adults-note" className="block text-[13px] font-medium text-on-surface-variant mb-1.5">Texto de la nota</label>
        <GrowText
          multiline
          id="adults-note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={ADULTS_NOTE_MAX}
          aria-describedby="adults-note-count"
          className={`${inputCls} min-h-28 leading-relaxed`}
        />
        <p id="adults-note-count" className="mt-1.5 text-xs text-on-surface-variant tabular-nums">
          {text.length} de {ADULTS_NOTE_MAX} caracteres. Que suene cercano: es un evento familiar y para adultos, no un reproche.
        </p>
      </div>

      <div>
        <p className="text-[13px] font-medium text-on-surface-variant mb-1.5">Así lo verán los invitados</p>
        <AdultsNote text={text} />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {text.trim() !== ADULTS_NOTE_DEFAULT && (
          <button type="button" onClick={() => setText(ADULTS_NOTE_DEFAULT)} className={btnGhost}>
            <RotateCcw className="w-4 h-4" aria-hidden />
            Volver al texto original
          </button>
        )}
        <button type="submit" disabled={!dirty} className={btnPrimary}>
          <Save className="w-4 h-4" aria-hidden />
          Guardar nota
        </button>
      </div>
    </form>
  );
}
