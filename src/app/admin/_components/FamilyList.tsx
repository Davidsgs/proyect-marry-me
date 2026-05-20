"use client"

import { deleteFamily, updateFamily } from "@/app/actions/admin";
import type { families as familiesTable, users as usersTable } from "@/db/schema";
import { Trash2, UserCheck } from "lucide-react";

interface Props {
    families: typeof familiesTable.$inferSelect[];
    users: typeof usersTable.$inferSelect[];
}

export default function FamilyList({ families, users }: Props) {
    if (families.length === 0) return (
        <div className="bg-surface-container-low border-none rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <p className="text-on-surface-variant font-sans tracking-wide text-sm">No hay familias registradas aún.</p>
        </div>
    );

    const handleDelegateChange = async (familyId: number, value: string) => {
        const delegateUserId = value === "" ? null : Number(value);
        await updateFamily(familyId, { delegateUserId });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map(family => {
                const familyUsers = users.filter(u => u.familyId === family.id);

                return (
                    <div key={family.id} className="flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/30 to-transparent"></div>
                        
                        <div className="z-10 w-full pr-8">
                            <span className="font-serif text-lg text-on-surface truncate block">{family.name}</span>
                            {family.alias && (
                                <span className="text-xs text-on-surface-variant italic block mt-0.5 truncate">{family.alias}</span>
                            )}
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

                        {/* Delegate selector */}
                        <div className="z-10 mt-4 pt-3 border-t border-surface-container-low">
                            <label className="flex items-center gap-1.5 text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-1.5">
                                <UserCheck className="w-3 h-3" /> Delegado
                            </label>
                            {familyUsers.length > 0 ? (
                                <div className="relative">
                                    <select
                                        value={family.delegateUserId?.toString() ?? ""}
                                        onChange={(e) => handleDelegateChange(family.id, e.target.value)}
                                        className="w-full px-3 py-2 text-xs border-none rounded-lg bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface appearance-none cursor-pointer"
                                    >
                                        <option value="">Sin delegado</option>
                                        {familyUsers.map(u => (
                                            <option key={u.id} value={u.id.toString()}>
                                                {u.name} {u.lastName}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-on-surface-variant/60 italic">Sin invitados asignados</p>
                            )}
                        </div>

                        <button onClick={() => deleteFamily(family.id)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 hover:text-error transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    )
}

