// Esqueleto con la forma de una sección (encabezado + tarjetas + contenido):
// aparece al instante al navegar mientras el servidor prepara la página.
export default function AdminLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-pulse" aria-busy="true" aria-label="Cargando">
            <div className="space-y-3">
                <div className="h-10 w-56 rounded-xl bg-surface-container" />
                <div className="h-4 w-80 max-w-full rounded-lg bg-surface-container-low" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-surface-container-low" />
                ))}
            </div>
            <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-surface-container-low" />
                ))}
            </div>
        </div>
    );
}
