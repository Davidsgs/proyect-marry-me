"use client";

import { createTask } from "@/app/actions/tasks";
import { Plus } from "lucide-react";
import { useRef } from "react";
import { btnPrimary } from "@/app/admin/_components/ui";

export default function TaskForm() {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await createTask({
                    title: formData.get("title") as string,
                    description: (formData.get("description") as string) || "",
                    dueDate: (formData.get("dueDate") as string) || undefined,
                });
                formRef.current?.reset();
            }}
            className="space-y-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm"
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                    <label className="block text-sm font-sans font-medium text-on-surface-variant mb-2">
                        Título
                    </label>
                    <input
                        required
                        type="text"
                        name="title"
                        className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm"
                        placeholder="Ej. Pago al fotógrafo"
                    />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-sm font-sans font-medium text-on-surface-variant mb-2">
                        Descripción <span className="font-normal text-on-surface-variant/80">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        name="description"
                        className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm"
                        placeholder="Detalles adicionales..."
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-sans font-medium text-on-surface-variant mb-2">
                        Fecha límite
                    </label>
                    <input
                        type="date"
                        name="dueDate"
                        className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface shadow-sm"
                    />
                </div>
                <div className="md:col-span-12 flex justify-end">
                    <button type="submit" className={btnPrimary}>
                        <Plus className="w-4 h-4" />
                        Añadir tarea
                    </button>
                </div>
            </div>
        </form>
    );
}
