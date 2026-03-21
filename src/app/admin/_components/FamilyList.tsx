"use client"

import { deleteFamily } from "@/app/actions/admin";
import type { families as familiesTable } from "@/db/schema";

export default function FamilyList({ families }: { families: typeof familiesTable.$inferSelect[] }) {
    if (families.length === 0) return <p className="text-gray-500 italic text-sm mt-4">No hay familias registradas.</p>;

    return (
        <ul className="mt-6 space-y-3">
            {families.map(family => (
                <li key={family.id} className="flex justify-between items-center bg-wedding-sage/5 p-3 rounded-md border border-wedding-sage/20 text-sm">
                    <div>
                        <span className="font-semibold block text-wedding-olive">{family.name}</span>
                        <span className="text-xs text-gray-500">ID: {family.id} | Status: {family.globalRsvpStatus}</span>
                    </div>
                    <button onClick={() => deleteFamily(family.id)} className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition-colors text-xs font-medium">
                        Eliminar
                    </button>
                </li>
            ))}
        </ul>
    )
}
