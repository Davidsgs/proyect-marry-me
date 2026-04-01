"use client"

import { deleteUser } from "@/app/actions/admin";
import type { users as usersTable, families as familiesTable } from "@/db/schema";
import { Trash2, UserCircle, Crown, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Props {
    users: typeof usersTable.$inferSelect[];
    families: typeof familiesTable.$inferSelect[];
}

export default function UserList({ users, families }: Props) {
    if (users.length === 0) return (
        <div className="bg-surface-container-low border-none rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <p className="text-on-surface-variant font-sans tracking-wide text-sm">No hay usuarios registrados.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map(user => {
                const familyName = families.find(f => f.id === user.familyId)?.name || 'Sin familia';
                
                // Set the correct icon based on role
                let RoleIcon = UserCircle;
                let roleColor = "text-on-surface-variant";
                if (user.role === 'ADMIN') {
                    RoleIcon = ShieldAlert;
                    roleColor = "text-error";
                } else if (user.role === 'MAIN_GUEST') {
                    RoleIcon = Crown;
                    roleColor = "text-primary";
                }

                return (
                    <div key={user.id} className="relative flex flex-col bg-surface-container-lowest p-5 rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                        <div className="flex justify-between items-start w-full pr-8">
                            <div className="flex gap-3">
                                <div className={`mt-1 bg-surface-container p-2 rounded-xl border-none ${roleColor}`}>
                                    <RoleIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-serif text-lg text-on-surface block leading-tight">{user.fullname || `${user.name} ${user.lastName}`}</span>
                                    <span className="text-xs text-on-surface-variant block font-sans truncate max-w-[180px]">{user.email}</span>
                                    
                                    <div className="flex flex-wrap gap-2 text-[10px] font-sans tracking-widest uppercase font-medium mt-3">
                                        <span className="bg-surface-container-low border-none text-on-surface-variant px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                            {familyName}
                                        </span>
                                        <span className="bg-surface-container border-none text-on-surface-variant px-2 py-0.5 rounded-full">
                                            {user.role === 'MAIN_GUEST' ? 'Titular' : user.role === 'ADMIN' ? 'Admin' : 'Acompañante'}
                                        </span>
                                        {user.isConfirmed && (
                                            <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full border-none">
                                                <CheckCircle2 className="w-3 h-3" /> Asistirá
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => deleteUser(user.id)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 hover:text-error transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    )
}
