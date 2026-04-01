"use client"

import { deleteFamily } from "@/app/actions/admin";
import type { families as familiesTable } from "@/db/schema";
import { Trash2 } from "lucide-react";

export default function FamilyList({ families }: { families: typeof familiesTable.$inferSelect[] }) {
    if (families.length === 0) return (
        <div className="bg-surface-container-low border-none rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <p className="text-on-surface-variant font-sans tracking-wide text-sm">No hay familias registradas aún.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map(family => (
                <div key={family.id} className="flex justify-between items-start bg-surface-container-lowest p-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/30 to-transparent"></div>
                    <div className="z-10 w-full pr-8">
                        <span className="font-serif text-lg text-on-surface truncate block">{family.name}</span>
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                            <span className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full border-none">ID: {family.id}</span>
                            <span className={`text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full border-none ${
                                family.globalRsvpStatus === 'CONFIRMED' ? 'bg-primary/10 text-primary' :
                                family.globalRsvpStatus === 'DECLINED' ? 'bg-error/10 text-error' :
                                'bg-surface-container text-on-surface-variant'
                            }`}>
                                {family.globalRsvpStatus === 'CONFIRMED' ? 'Confirmado' : family.globalRsvpStatus === 'DECLINED' ? 'Cancelado' : 'Pendiente'}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => deleteFamily(family.id)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 hover:text-error transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
