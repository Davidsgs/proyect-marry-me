"use client"

import { createFamily } from "@/app/actions/admin";
import { Plus } from "lucide-react";

export default function FamilyForm() {
    return (
        <form action={async (formData) => {
            await createFamily({
                name: formData.get("name") as string,
                globalRsvpStatus: formData.get("globalRsvpStatus") as "PENDING" | "CONFIRMED" | "DECLINED",
            })
        }} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-wedding-sage-dark mb-2">Nombre de la Familia</label>
                <input required type="text" name="name" className="w-full px-4 py-3 border border-wedding-olive/20 rounded-xl bg-wedding-cream/30 focus:bg-white focus:ring-2 focus:ring-wedding-olive/50 focus:border-wedding-olive transition-all outline-none text-wedding-sage-darkest placeholder-wedding-sage-light" placeholder="Familia García López" />
            </div>
            <div className="md:col-span-4">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-wedding-sage-dark mb-2">Estado Global</label>
                <div className="relative">
                    <select name="globalRsvpStatus" className="w-full px-4 py-3 border border-wedding-olive/20 rounded-xl bg-wedding-cream/30 focus:bg-white focus:ring-2 focus:ring-wedding-olive/50 focus:border-wedding-olive transition-all outline-none text-wedding-sage-darkest appearance-none">
                        <option value="PENDING">Pendiente</option>
                        <option value="CONFIRMED">Asistirán</option>
                        <option value="DECLINED">No asistirán</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-wedding-sage-dark">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2">
                <button type="submit" className="w-full bg-wedding-olive hover:bg-wedding-sage-darkest text-wedding-cream py-3 rounded-xl transition-colors shadow-[0_2px_10px_rgba(111,127,106,0.2)] hover:shadow-[0_4px_15px_rgba(111,127,106,0.25)] font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 h-[48px]">
                    <Plus className="w-4 h-4" /> Añadir
                </button>
            </div>
        </form>
    )
}
