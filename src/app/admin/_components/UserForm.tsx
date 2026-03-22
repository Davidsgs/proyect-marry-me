"use client"

import { createUser } from "@/app/actions/admin";
import type { families as familiesTable } from "@/db/schema";

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
        }} className="space-y-4">
            <div className="flex gap-4">
                <div className="w-1/2">
                    <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Nombre(s)</label>
                    <input required type="text" name="name" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none" placeholder="David" />
                </div>
                <div className="w-1/2">
                    <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Apellidos</label>
                    <input required type="text" name="lastName" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none" placeholder="García" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Correo Electrónico (Google Auth)</label>
                <input required type="email" name="email" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none" placeholder="correo@gmail.com" />
            </div>
            <div>
                <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Familia</label>
                <select required name="familyId" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none">
                    <option value="">Selecciona Familia...</option>
                    {families.map(f => <option key={f.id} value={f.id}>{f.name} (ID: {f.id})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Rol</label>
                <select name="role" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none">
                    <option value="GUEST">Invitado Opcional (GUEST)</option>
                    <option value="MAIN_GUEST">Invitado Principal (MAIN_GUEST - Quien Confirma Asistencia)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
            </div>
            <button type="submit" className="w-full bg-wedding-blush text-white py-2 rounded-md hover:bg-wedding-blush/90 transition-colors shadow-sm font-medium">
                Añadir Usuario
            </button>
        </form>
    )
}
