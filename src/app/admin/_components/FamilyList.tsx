"use client"

import { deleteFamily } from "@/app/actions/admin";
import type { families as familiesTable } from "@/db/schema";
import { Trash2 } from "lucide-react";

export default function FamilyList({ families }: { families: typeof familiesTable.$inferSelect[] }) {
    if (families.length === 0) return (
        <div className="bg-wedding-cream/30 border border-wedding-olive/10 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <p className="text-wedding-sage-dark font-sans tracking-wide text-sm">No hay familias registradas aún.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map(family => (
                <div key={family.id} className="flex justify-between items-start bg-white p-5 rounded-2xl border border-wedding-olive/10 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-wedding-olive/40 to-transparent"></div>
                    <div className="z-10 w-full pr-8">
                        <span className="font-serif text-lg text-wedding-sage-darkest truncate block">{family.name}</span>
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                            <span className="text-[10px] font-sans tracking-widest uppercase font-medium text-wedding-olive/70 bg-wedding-olive/5 px-2 py-0.5 rounded-full border border-wedding-olive/10">ID: {family.id}</span>
                            <span className={`text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full border ${
                                family.globalRsvpStatus === 'CONFIRMED' ? 'bg-wedding-olive/10 text-wedding-olive border-wedding-olive/20' :
                                family.globalRsvpStatus === 'DECLINED' ? 'bg-wedding-blush/10 text-wedding-blush-dark border-wedding-blush/20' :
                                'bg-wedding-sage/10 text-wedding-sage-dark border-wedding-sage/20'
                            }`}>
                                {family.globalRsvpStatus === 'CONFIRMED' ? 'Confirmado' : family.globalRsvpStatus === 'DECLINED' ? 'Cancelado' : 'Pendiente'}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => deleteFamily(family.id)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-wedding-blush hover:bg-wedding-blush-light/50 hover:text-wedding-blush-dark transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
