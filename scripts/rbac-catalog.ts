// Fuente única de verdad del RBAC: roles, permisos (con descripción tipo Discord)
// y las asignaciones rol→permiso. Lo consumen `seed-rbac.ts` (instalación nueva)
// y `migrate-per-admin-perms.ts` (bases existentes), para que nunca diverjan.

export const systemRoles = [
  { key: "admin", label: "Administrador", isSystem: true },
  { key: "main_guest", label: "Invitado Principal (Delegado)", isSystem: true },
  { key: "guest", label: "Invitado", isSystem: true },
];

// `description` es el "detalle de qué hace cada permiso" que se muestra junto al
// toggle on/off en el editor de permisos por administrador (estilo Discord).
export const systemPermissions = [
  { key: "users.read", label: "Leer Usuarios", section: "users", description: "Ver la lista de invitados y sus datos." },
  { key: "users.write", label: "Escribir/Modificar Usuarios", section: "users", description: "Crear, editar y eliminar invitados." },
  { key: "families.read", label: "Leer Familias", section: "families", description: "Ver las familias y su estado de confirmación." },
  { key: "families.write", label: "Escribir/Modificar Familias", section: "families", description: "Crear, editar y eliminar familias; asignar delegados." },
  { key: "tables.read", label: "Leer Mesas", section: "tables", description: "Ver el plano de mesas y su distribución." },
  { key: "tables.write", label: "Escribir/Modificar Mesas", section: "tables", description: "Crear, editar y reorganizar mesas; asignar invitados." },
  { key: "calendar.read", label: "Leer Calendario", section: "calendar", description: "Ver el cronograma del día de la boda." },
  { key: "calendar.write", label: "Escribir/Modificar Calendario", section: "calendar", description: "Crear, editar y reordenar actividades del cronograma." },
  { key: "tasks.read", label: "Leer Tareas", section: "tasks", description: "Ver la lista de tareas." },
  { key: "tasks.write", label: "Escribir/Modificar Tareas", section: "tasks", description: "Crear, completar y eliminar tareas." },
  { key: "whiteboard.read", label: "Leer Pizarra", section: "whiteboard", description: "Ver la pizarra de notas." },
  { key: "whiteboard.write", label: "Escribir/Modificar Pizarra", section: "whiteboard", description: "Editar la pizarra de notas." },
  { key: "rsvp.confirm_own_family", label: "Confirmar RSVP de Familia Propia", section: "rsvp", description: "Confirmar la asistencia de su propia familia." },
  { key: "rsvp.view_own_family", label: "Ver RSVP de Familia Propia", section: "rsvp", description: "Ver el estado de RSVP de su propia familia." },
  { key: "admin.dashboard", label: "Acceder al Panel Admin", section: "admin", description: "Acceder al panel de administración. Acceso base de todo administrador." },
  { key: "settings.write", label: "Modificar Ajustes del Evento", section: "settings", description: "Modificar los ajustes globales del evento y los permisos de los administradores." },
];

// Permiso base que define "es administrador". Se concede vía el rol `admin` y NO
// es editable por usuario (siempre activo para admins). El resto de permisos se
// conceden por administrador en user_permissions.
export const BASELINE_ADMIN_PERMS = ["admin.dashboard"];

// Asignaciones rol→permiso. El rol `admin` solo concede el acceso base; cada
// capacidad extra de un administrador vive en user_permissions (editable).
export const rolePermAssignments = [
  { roleKey: "admin", perms: BASELINE_ADMIN_PERMS },
  { roleKey: "main_guest", perms: ["rsvp.confirm_own_family", "rsvp.view_own_family"] },
  { roleKey: "guest", perms: ["rsvp.view_own_family"] },
];
