"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { setConfig } from "@/app/actions/config";
import { btnPrimary, inputCls } from "@/app/admin/_components/ui";
import { useNotify } from "@/app/admin/_components/Notice";
import { GrowText } from "@/components/GrowText";
import { STORY_MAX } from "@/lib/wedding";

// Texto de «Nuestra historia» (clave story). Vacío = la sección no aparece.
// Guardado optimista: si falla, vuelve el texto anterior.
export default function StoryForm({ initial }: { initial: string }) {
  const notify = useNotify();
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const dirty = text.trim() !== saved.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    const prev = saved;
    setText(clean);
    setSaved(clean);
    setConfig("story", clean)
      .then(() => notify(clean ? "Historia guardada" : "Historia vacía: la sección no se muestra"))
      .catch(() => {
        setText(prev);
        setSaved(prev);
        notify("No se pudo guardar la historia. Se deshizo el cambio.", "error");
      });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="story-text" className="block text-label font-medium text-on-surface-variant mb-1.5">Texto</label>
        <GrowText
          multiline
          id="story-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={STORY_MAX}
          aria-describedby="story-count"
          placeholder="Érase una vez…"
          className={`${inputCls} min-h-40 leading-relaxed`}
        />
        <p id="story-count" className="mt-1.5 text-xs text-on-surface-variant tabular-nums">
          {text.length} de {STORY_MAX} caracteres. Deja una línea en blanco entre párrafos.
        </p>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!dirty} className={btnPrimary}>
          <Save className="w-4 h-4" aria-hidden />
          Guardar historia
        </button>
      </div>
    </form>
  );
}
