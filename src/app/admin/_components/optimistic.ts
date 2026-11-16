"use client";

import { useOptimistic, useTransition } from "react";
import { useNotify } from "./Notice";

// Cambios optimistas: la pantalla aplica el cambio al momento y la llamada al
// servidor sigue en segundo plano. Cuando termina, la respuesta trae los datos
// revalidados y sustituyen a los optimistas. Si falla, React descarta el cambio
// optimista (vuelve lo que había) y se avisa del error.
//
//   const [items, mutate] = useOptimisticState(serverItems);
//   mutate((s) => s.filter((x) => x.id !== id), () => deleteItem(id), { ok: "Eliminado", error: "No se pudo eliminar" });

export type Patch<T> = (state: T) => T;

export function useOptimisticState<T>(server: T) {
    const notify = useNotify();
    const [state, apply] = useOptimistic(server, (s: T, patch: Patch<T>) => patch(s));
    const [pending, startTransition] = useTransition();

    /** Devuelve true si el servidor aceptó el cambio (útil para restaurar un formulario si falla). */
    function mutate(patch: Patch<T>, action: () => Promise<unknown>, msg: { ok?: string; error: string }): Promise<boolean> {
        return new Promise((resolve) => {
            startTransition(async () => {
                apply(patch);
                try {
                    await action();
                    if (msg.ok) notify(msg.ok);
                    resolve(true);
                } catch {
                    notify(`${msg.error}. Se deshizo el cambio.`, "error");
                    resolve(false);
                }
            });
        });
    }

    return [state, mutate, pending] as const;
}

/** Id provisional (negativo) para elementos creados en pantalla antes de que el servidor responda. */
export function tempId() {
    return -Math.floor(Math.random() * 1e9) - 1;
}

/** Elemento recién creado que aún no confirmó el servidor (id provisional). */
export const isTemp = (id: number) => id < 0;

/** Estilo de una fila provisional: parpadea y no se puede tocar hasta que llega la real. */
export const pendingRowCls = "motion-safe:animate-pulse opacity-70 pointer-events-none";
