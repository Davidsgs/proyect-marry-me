"use client";

import { useMemo, useState } from "react";
import { setUserPermission, type AdminWithPermissions, type PermissionDef } from "@/app/actions/permissions";
import { ChevronDown, ShieldCheck, Loader2, AlertCircle, Lock } from "lucide-react";

interface Props {
  admins: AdminWithPermissions[];
  permissions: PermissionDef[];
  currentUserId: number;
}

// Etiquetas legibles por sección para agrupar los permisos en el editor.
const SECTION_LABELS: Record<string, string> = {
  users: "Invitados",
  families: "Familias",
  tables: "Mesas",
  calendar: "Cronograma",
  tasks: "Tareas",
  finance: "Economía",
  whiteboard: "Pizarra",
  rsvp: "RSVP",
  settings: "Ajustes",
  admin: "Administración",
};

export default function AdminPermissionsManager({ admins, permissions, currentUserId }: Props) {
  // Estado local de permisos concedidos por admin: userId -> Set(permKeys).
  const [granted, setGranted] = useState<Record<number, Set<string>>>(() => {
    const initial: Record<number, Set<string>> = {};
    for (const a of admins) initial[a.id] = new Set(a.permissionKeys);
    return initial;
  });
  const [openId, setOpenId] = useState<number | null>(admins[0]?.id ?? null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Permisos agrupados por sección, preservando el orden recibido.
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionDef[]>();
    for (const p of permissions) {
      const list = map.get(p.section) ?? [];
      list.push(p);
      map.set(p.section, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  const toggle = async (userId: number, key: string, next: boolean) => {
    const pendingKey = `${userId}:${key}`;
    setError(null);

    // Optimista: aplicar el cambio en local antes de confirmar.
    setGranted((prev) => {
      const set = new Set(prev[userId]);
      if (next) set.add(key);
      else set.delete(key);
      return { ...prev, [userId]: set };
    });
    setPending((prev) => new Set(prev).add(pendingKey));

    try {
      await setUserPermission(userId, key, next);
    } catch (err) {
      // Revertir en caso de error.
      setGranted((prev) => {
        const set = new Set(prev[userId]);
        if (next) set.delete(key);
        else set.add(key);
        return { ...prev, [userId]: set };
      });
      setError(err instanceof Error ? err.message : "No se pudo guardar el permiso.");
    } finally {
      setPending((prev) => {
        const s = new Set(prev);
        s.delete(pendingKey);
        return s;
      });
    }
  };

  if (admins.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant font-sans">
        No hay administradores. Crea un invitado con rol Administrador para gestionar sus permisos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm font-sans bg-wedding-blush-light bg-opacity-10 text-wedding-blush-darkest border border-wedding-blush-light border-opacity-30">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {admins.map((admin) => {
        const set = granted[admin.id] ?? new Set<string>();
        const isOpen = openId === admin.id;
        const enabledCount = permissions.filter((p) => set.has(p.key)).length;

        return (
          <div key={admin.id} className="rounded-2xl bg-surface-container/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : admin.id)}
              className="w-full flex items-center gap-4 p-4 sm:p-5 text-left border-none bg-transparent hover:bg-primary/5 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg text-on-surface truncate">
                  {admin.fullname}
                  {admin.id === currentUserId && (
                    <span className="ml-2 text-xs font-sans text-primary/70 align-middle">(tú)</span>
                  )}
                </p>
                <p className="text-xs font-sans text-on-surface-variant truncate">
                  {admin.email ?? "Sin correo"} · {enabledCount} de {permissions.length} permisos
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-on-surface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="px-4 sm:px-5 pb-5 space-y-6">
                {grouped.map(([section, perms]) => (
                  <div key={section} className="space-y-1">
                    <h4 className="text-[11px] font-sans tracking-widest uppercase font-semibold text-on-surface-variant/80 pt-2">
                      {SECTION_LABELS[section] ?? section}
                    </h4>
                    {perms.map((perm) => {
                      const checked = set.has(perm.key);
                      const pendingKey = `${admin.id}:${perm.key}`;
                      const isPending = pending.has(pendingKey);
                      // Bloqueo anti-autobloqueo: no quitarte settings.write a ti mismo.
                      const locked = admin.id === currentUserId && perm.key === "settings.write";

                      return (
                        <div
                          key={perm.key}
                          className="flex items-start gap-4 py-3 border-b border-surface-container/40 last:border-b-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-sm font-medium text-on-surface">{perm.label}</p>
                            <p className="font-sans text-xs text-on-surface-variant mt-0.5">{perm.description}</p>
                          </div>
                          <Switch
                            checked={checked}
                            disabled={isPending || locked}
                            pending={isPending}
                            locked={locked}
                            onChange={(next) => toggle(admin.id, perm.key, next)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Switch({
  checked,
  disabled,
  pending,
  locked,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  pending?: boolean;
  locked?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      title={locked ? "No puedes quitarte tu propio permiso de Ajustes" : undefined}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors border-none mt-0.5 ${
        checked ? "bg-primary" : "bg-on-surface-variant/30"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm transform transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : locked ? (
          <Lock className="h-2.5 w-2.5 text-on-surface-variant" />
        ) : null}
      </span>
    </button>
  );
}
