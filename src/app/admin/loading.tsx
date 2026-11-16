// Esqueleto genérico del panel (título + franja de estado + lista). Cada sección
// con forma propia tiene su loading.tsx.
export default function AdminLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-pulse" aria-busy="true" aria-label="Cargando">
            <div className="space-y-3">
                <div className="h-12 w-56 rounded-xl bg-surface-container" />
                <div className="h-4 w-80 max-w-full rounded-lg bg-surface-container-low" />
            </div>
            <div className="h-24 rounded-2xl bg-surface-container-low" />
            <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-surface-container-low" />
                ))}
            </div>
        </div>
    );
}
