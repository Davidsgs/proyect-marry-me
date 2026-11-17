"use client";

import { useState } from "react";
import { GrowText } from "@/components/GrowText";
import { setConfig } from "@/app/actions/config";
import { Save } from "lucide-react";
import { btnPrimary, inputCls } from "@/app/admin/_components/ui";
import { useNotify } from "@/app/admin/_components/Notice";

type Gifts = { holder: string; alias: string; cbu: string; note: string };
const KEYS: Record<keyof Gifts, string> = { holder: "gift_holder", alias: "gift_alias", cbu: "gift_cbu", note: "gift_note" };

// Datos de la sección «Regalos» de la invitación. Si alias y CBU quedan vacíos, la sección no aparece.
export default function GiftsForm({ initial }: { initial: Gifts }) {
  const notify = useNotify();
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Gifts) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setData((d) => ({ ...d, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cbu = data.cbu.replace(/\s+/g, "");
    if (cbu && !/^\d{22}$/.test(cbu)) return setError("El CBU/CVU tiene 22 dígitos.");
    setError(null);
    const clean = { ...data, cbu, holder: data.holder.trim(), alias: data.alias.trim(), note: data.note.trim() };
    // Solo las claves que cambiaron: cada setConfig es un viaje a la base.
    const changed = (Object.keys(KEYS) as (keyof Gifts)[]).filter((k) => clean[k] !== saved[k]);
    if (changed.length === 0) return notify("Sin cambios");
    // Optimista: se da por guardado y, si falla, vuelven los datos anteriores.
    const prev = saved;
    setData(clean);
    setSaved(clean);
    Promise.all(changed.map((k) => setConfig(KEYS[k], clean[k])))
      .then(() => notify("Datos de regalos guardados"))
      .catch(() => {
        setData(prev);
        setSaved(prev);
        notify("No se pudieron guardar los datos de regalos. Se deshizo el cambio.", "error");
      });
  }

  const label = "block text-label font-medium text-on-surface-variant mb-1.5";
  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className={label}>Titular de la cuenta</span>
        <input value={data.holder} onChange={set("holder")} className={inputCls} autoComplete="off" />
      </label>
      <label className="block">
        <span className={label}>Alias</span>
        <input value={data.alias} onChange={set("alias")} className={inputCls} autoComplete="off" />
      </label>
      <label className="block">
        <span className={label}>CBU o CVU</span>
        <input value={data.cbu} onChange={set("cbu")} inputMode="numeric" className={`${inputCls} tabular-nums`} autoComplete="off" />
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Mensaje para los invitados <span className="font-normal">(opcional)</span></span>
        <GrowText multiline value={data.note} onChange={set("note")} className={`${inputCls} min-h-24`} placeholder="Si lo dejas vacío se muestra un mensaje por defecto." />
      </label>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-error">{error}</p>}
      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" className={btnPrimary}>
          <Save className="w-4 h-4" aria-hidden />
          Guardar datos
        </button>
      </div>
    </form>
  );
}
