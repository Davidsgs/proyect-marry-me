"use client"

import { deleteUser } from "@/app/actions/admin";
import type { users as usersTable, families as familiesTable } from "@/db/schema";

interface Props {
    users: typeof usersTable.$inferSelect[];
    families: typeof familiesTable.$inferSelect[];
}

export default function UserList({ users, families }: Props) {
    if (users.length === 0) return <p className="text-gray-500 italic mt-4 text-sm">No hay usuarios registrados.</p>;

    return (
        <ul className="mt-6 space-y-3">
            {users.map(user => {
                const familyName = families.find(f => f.id === user.familyId)?.name || 'Sin familia';
                return (
                    <li key={user.id} className="flex justify-between items-start bg-wedding-blush/5 p-3 rounded-md border border-wedding-blush/20 text-sm">
                        <div className="space-y-1">
                            <span className="font-semibold block text-wedding-sage-darkest">{user.fullname || `${user.name} ${user.lastName}`}</span>
                            <span className="text-xs text-gray-600 block">{user.email}</span>
                            <div className="flex gap-2 text-xs mt-1">
                                <span className="bg-wedding-olive/10 text-wedding-olive px-2 py-0.5 rounded-full">{user.role}</span>
                                <span className="bg-wedding-cream px-2 py-0.5 rounded-full text-gray-600 truncate max-w-[150px]">{familyName}</span>
                            </div>
                        </div>
                        <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition-colors text-xs font-medium ml-2 shrink-0">
                            Eliminar
                        </button>
                    </li>
                );
            })}
        </ul>
    )
}
