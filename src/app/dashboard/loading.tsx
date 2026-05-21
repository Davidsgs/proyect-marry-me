import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 text-wedding-olive animate-spin" />
            <p className="text-xs font-sans tracking-[0.2em] uppercase text-gray-600 font-medium">
                Cargando
            </p>
        </div>
    );
}
