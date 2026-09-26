"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { btnDanger, btnGhost, btnPrimary } from "./ui";

// Confirmación propia del panel (sustituye al confirm() del navegador).
// Uso:  const confirm = useConfirm();
//       if (await confirm({ title: "¿Eliminar la mesa 3?", confirmLabel: "Eliminar" })) { ... }
type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** "danger" (por defecto) para borrar o vaciar; "default" para el resto. */
  tone?: "danger" | "default";
};

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolveRef.current?.(false);
    setOpts(next);
    dialogRef.current?.showModal();
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(ok: boolean) {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    dialogRef.current?.close();
  }

  const danger = (opts?.tone ?? "danger") === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        // Escape o clic fuera = cancelar.
        onCancel={() => close(false)}
        onClick={(e) => { if (e.target === dialogRef.current) close(false); }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-on-surface/30 open:animate-in open:fade-in open:zoom-in-95 open:duration-150"
      >
        {opts && (
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <h2 className="font-serif text-xl text-on-surface text-balance">{opts.title}</h2>
              {opts.description && (
                <p className="text-sm font-sans text-on-surface-variant text-pretty">{opts.description}</p>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" autoFocus={danger} onClick={() => close(false)} className={btnGhost}>
                Cancelar
              </button>
              <button type="button" autoFocus={!danger} onClick={() => close(true)} className={danger ? btnDanger : btnPrimary}>
                {opts.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
