"use client";

import { useState } from "react";
import { setConfig } from "@/app/actions/config";
import { Calendar, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SettingsFormProps {
  initialDeadline: string | null;
}

export default function SettingsForm({ initialDeadline }: SettingsFormProps) {
  const [deadline, setDeadline] = useState(initialDeadline || "");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      await setConfig("rsvp_deadline", deadline);
      setStatus({
        type: "success",
        message: "¡La fecha límite de confirmación se ha guardado correctamente!",
      });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        message: "Hubo un error al guardar la fecha límite. Revisa tus permisos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant">
          Fecha y Hora Límite (RSVP)
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/70">
            <Calendar className="h-5 w-5" />
          </div>
          <input
            required
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-surface-container bg-opacity-70 focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 font-sans shadow-sm"
          />
        </div>
      </div>

      {status && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl text-sm font-sans animate-fade-in transition-all ${
            status.type === "success"
              ? "bg-wedding-sage-light bg-opacity-10 text-wedding-sage-darkest border border-wedding-sage-light border-opacity-30"
              : "bg-wedding-blush-light bg-opacity-10 text-wedding-blush-darkest border border-wedding-blush-light border-opacity-30"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/95 text-on-primary py-3.5 px-4 rounded-xl transition-all shadow-md font-sans tracking-widest uppercase text-xs font-semibold flex items-center justify-center gap-2 border-none disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Guardando...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Guardar Ajustes</span>
          </>
        )}
      </button>
    </form>
  );
}
