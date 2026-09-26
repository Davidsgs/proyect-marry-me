// Esqueleto con la forma del panel mientras cargan los datos.
export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Cargando tu invitación">
            <div className="space-y-3 flex flex-col items-center">
                <div className="h-12 w-64 max-w-full rounded-xl bg-surface-container" />
                <div className="h-4 w-80 max-w-full rounded-lg bg-surface-container-low" />
            </div>
            <div className="h-40 rounded-3xl bg-surface-container-low" />
            <div className="h-72 rounded-3xl bg-surface-container-low" />
        </div>
    );
}
