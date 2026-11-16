// Esqueleto con la forma de la invitación mientras cargan los datos.
export default function DashboardLoading() {
    return (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-10 sm:pt-14 pb-16 space-y-10 animate-pulse" aria-busy="true" aria-label="Cargando tu invitación">
            <div className="space-y-4 flex flex-col items-center">
                <div className="h-14 w-72 max-w-full rounded-xl bg-crema/60" />
                <div className="h-5 w-80 max-w-full rounded-lg bg-crema/50" />
            </div>
            <div className="h-96 rounded-[2rem] bg-crema/60" />
        </div>
    );
}
