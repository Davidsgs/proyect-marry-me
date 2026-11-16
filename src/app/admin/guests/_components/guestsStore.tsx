"use client";

import { createContext, useContext } from "react";
import type { families as familiesTable, users as usersTable } from "@/db/schema";
import type { Patch } from "@/app/admin/_components/optimistic";

export type Family = typeof familiesTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type GuestsData = { families: Family[]; users: User[] };
export type GuestsMutate = (patch: Patch<GuestsData>, action: () => Promise<unknown>, msg: { ok?: string; error: string }) => Promise<boolean>;

// Familias e invitados con cambios optimistas, compartidos entre la lista, la
// ficha de familia y los formularios. GuestsManager crea el estado.
export const GuestsCtx = createContext<GuestsMutate | null>(null);

export function useGuestsMutate() {
    const ctx = useContext(GuestsCtx);
    if (!ctx) throw new Error("useGuestsMutate debe usarse dentro de GuestsManager");
    return ctx;
}

export const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

/** Invitado provisional, con los valores por defecto de la tabla users. */
export function draftUser(id: number, data: Partial<User> & Pick<User, "name">): User {
    const lastName = data.lastName ?? "";
    return {
        id, email: null, alias: null, lastName, fullname: `${data.name} ${lastName}`.trim(), familyId: null, tableId: null,
        role: "GUEST", ageCategory: "ADULT", isConfirmed: false, dietary: "NONE", dietaryNote: "",
        createdAt: nowSql(), updatedAt: nowSql(), ...data,
    };
}

/** Quita a un invitado de las listas y deja sin delegado a la familia que lo tenía. */
export const withoutUser = (id: number): Patch<GuestsData> => (d) => ({
    families: d.families.map((f) => (f.delegateUserId === id ? { ...f, delegateUserId: null } : f)),
    users: d.users.filter((u) => u.id !== id),
});
