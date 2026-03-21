"use client"

import { createFamily } from "@/app/actions/admin";

export default function FamilyForm() {
    return (
        <form action={async (formData) => {
            await createFamily({
                name: formData.get("name") as string,
                globalRsvpStatus: formData.get("globalRsvpStatus") as "PENDING" | "CONFIRMED" | "DECLINED",
            })
        }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Nombre de la Familia</label>
                <input required type="text" name="name" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none" placeholder="Familia García" />
            </div>
            <div>
                <label className="block text-sm font-medium text-wedding-sage-darkest mb-1">Estado Global (Opcional por ahora)</label>
                <select name="globalRsvpStatus" className="w-full px-4 py-2 border border-wedding-sage/30 rounded-md bg-wedding-cream/50 focus:ring-2 focus:ring-wedding-olive focus:outline-none">
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="DECLINED">Rechazada</option>
                </select>
            </div>
            <button type="submit" className="w-full bg-wedding-olive text-wedding-cream py-2 rounded-md hover:bg-wedding-olive/90 transition-colors shadow-sm font-medium">
                Añadir Familia
            </button>
        </form>
    )
}
