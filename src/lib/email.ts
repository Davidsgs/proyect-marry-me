// Google entrega el correo en minúsculas y el acceso compara por igualdad: un
// correo guardado como «Ana@Gmail.com» dejaría fuera a esa invitada. Se guarda
// y se busca siempre normalizado. Vacío = sin correo (null).
export function normalizeEmail(email: string | null | undefined): string | null {
    const clean = email?.trim().toLowerCase();
    return clean ? clean : null;
}
