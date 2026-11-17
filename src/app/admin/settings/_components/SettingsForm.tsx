"use client";

import { useState } from "react";
import { setConfig } from "@/app/actions/config";
import { Save } from "lucide-react";
import { btnPrimary, inputCls } from "@/app/admin/_components/ui";
import { useNotify } from "@/app/admin/_components/Notice";

export default function SettingsForm({ initialDeadline }: { initialDeadline: string | null }) {
  const notify = useNotify();
  const [deadline, setDeadline] = useState(initialDeadline || "");
  const [saved, setSaved] = useState(initialDeadline || "");

  // Optimista: el campo no se bloquea mientras se guarda; si falla, vuelve el valor anterior.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prev = saved;
    setSaved(deadline);
    setConfig("rsvp_deadline", deadline)
      .then(() => notify("Plazo guardado"))
      .catch(() => {
        setSaved(prev);
        setDeadline(prev);
        notify("No se pudo guardar el plazo. Se deshizo el cambio.", "error");
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-label font-medium text-on-surface-variant mb-1.5">Fecha y hora límite</span>
        <input required type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
      </label>
      <div className="flex justify-end">
        <button type="submit" disabled={deadline === saved} className={btnPrimary}>
          <Save className="w-4 h-4" aria-hidden />
          Guardar plazo
        </button>
      </div>
    </form>
  );
}
