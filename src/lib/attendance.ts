// Quien ya avisó que no viene: su familia respondió y esa persona no está
// marcada como asistente. Si sigue sentada, ocupa una silla que nadie usará.
export function declined(user: { isConfirmed: boolean | null }, family: { globalRsvpStatus: string } | undefined | null) {
    return Boolean(family && family.globalRsvpStatus !== "PENDING" && !user.isConfirmed);
}
