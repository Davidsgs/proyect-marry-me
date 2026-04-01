"use client"

import { createUser } from "@/app/actions/admin";
import type { families as familiesTable } from "@/db/schema";
import { Plus } from "lucide-react";

export default function UserForm({ families }: { families: typeof familiesTable.$inferSelect[] }) {
    return (
        <form action={async (formData) => {
            const familyId = Number(formData.get("familyId"));
            await createUser({
                email: formData.get("email") as string,
                name: formData.get("name") as string,
                lastName: formData.get("lastName") as string,
                familyId: isNaN(familyId) ? 0 : familyId,
                role: formData.get("role") as "ADMIN" | "MAIN_GUEST" | "GUEST",
            })
        }} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Nombre(s) <span className="text-error">*</span></label>
                <input required type="text" name="name" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm" placeholder="David" />
            </div>

            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Apellidos <span className="text-error">*</span></label>
                <input required type="text" name="lastName" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm" placeholder="García" />
            </div>

            <div className="md:col-span-12 lg:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Correo (acceso app) <span className="text-error">*</span></label>
                <input required type="email" name="email" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm" placeholder="correo@gmail.com" />
            </div>

            <div className="md:col-span-6 lg:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Familia <span className="text-error">*</span></label>
                <div className="relative">
                    <select required name="familyId" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface appearance-none shadow-sm">
                        <option value="" disabled selected>Selecciona...</option>
                        {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

            <div className="md:col-span-6 lg:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Rol Interno</label>
                <div className="relative">
                    <select name="role" className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface appearance-none shadow-sm">
                        <option value="MAIN_GUEST">Principal (Titular)</option>
                        <option value="GUEST" selected>Acompañante</option>
                        <option value="ADMIN">Administrador</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

            <div className="md:col-span-12 mt-2">
                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-xl transition-colors shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 h-[48px] border-none">
                    <Plus className="w-4 h-4" /> Registrar Invitado
                </button>
            </div>
        </form>
    )
}
