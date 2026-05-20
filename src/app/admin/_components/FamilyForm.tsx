"use client"

import { createFamily } from "@/app/actions/admin";
import { Plus } from "lucide-react";

export default function FamilyForm() {
    return (
        <form action={async (formData) => {
            await createFamily({
                name: formData.get("name") as string,
                alias: (formData.get("alias") as string) || "",
                globalRsvpStatus: formData.get("globalRsvpStatus") as "PENDING" | "CONFIRMED" | "DECLINED",
            })
        }} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Nombre de la Familia</label>
                <input required type="text" name="name" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm" placeholder="Familia García López" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Alias <span className="text-on-surface-variant/50">(opcional)</span></label>
                <input type="text" name="alias" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm" placeholder="Ej. Tíos paternos" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Estado Global</label>
                <div className="relative">
                    <select name="globalRsvpStatus" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface appearance-none shadow-sm">
                        <option value="PENDING">Pendiente</option>
                        <option value="CONFIRMED">Asistirán</option>
                        <option value="DECLINED">No asistirán</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2">
                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-xl transition-colors shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 h-[48px] border-none">
                    <Plus className="w-4 h-4" /> Añadir
                </button>
            </div>
        </form>
    )
}

