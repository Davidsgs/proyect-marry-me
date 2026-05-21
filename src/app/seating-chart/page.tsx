import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getTables } from "@/app/actions/tables";
import { getFamilies, getUsers } from "@/app/actions/admin";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

const AGE_TAG: Record<string, string> = { CHILD: "niño", BABY: "bebé" };

export default async function SeatingChartPage() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.read")) {
        redirect("/");
    }

    const [tables, families, users] = await Promise.all([getTables(), getFamilies(), getUsers()]);

    const familyName = (id: number | null) => families.find((f) => f.id === id)?.name ?? "Sin familia";
    const membersOf = (tableId: number) =>
        users
            .filter((u) => u.tableId === tableId && u.familyId != null)
            .sort((a, b) => a.fullname.localeCompare(b.fullname));
    const unassigned = users.filter((u) => u.tableId == null && u.familyId != null);

    return (
        <div className="min-h-screen bg-white text-neutral-900 print:bg-white">
            <div className="max-w-5xl mx-auto px-6 py-10 print:px-0 print:py-0">
                <div className="flex items-start justify-between gap-4 mb-8 print:mb-6">
                    <div>
                        <h1 className="font-serif italic text-3xl text-neutral-900">Distribución de Mesas</h1>
                        <p className="text-sm text-neutral-500 mt-1">David &amp; Rocio · 03 de Abril, 2026</p>
                    </div>
                    <PrintButton />
                </div>

                {tables.length === 0 ? (
                    <p className="text-neutral-500">No hay mesas configuradas.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4">
                        {tables.map((table) => {
                            const members = membersOf(table.id);
                            return (
                                <div
                                    key={table.id}
                                    className="border border-neutral-300 rounded-lg p-4 break-inside-avoid"
                                >
                                    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2 mb-3">
                                        <h2 className="font-serif text-xl">
                                            Mesa {table.number}
                                            {table.name && <span className="text-neutral-500 italic text-base font-sans"> · {table.name}</span>}
                                        </h2>
                                        <span className="text-xs text-neutral-500">{members.length}/{table.capacity}</span>
                                    </div>
                                    {members.length === 0 ? (
                                        <p className="text-sm text-neutral-400 italic">Sin invitados asignados</p>
                                    ) : (
                                        <ol className="space-y-1 text-sm">
                                            {members.map((m, i) => (
                                                <li key={m.id} className="flex justify-between gap-2">
                                                    <span>
                                                        <span className="text-neutral-400 mr-2">{i + 1}.</span>
                                                        {m.name} {m.lastName}
                                                        {AGE_TAG[m.ageCategory] && (
                                                            <span className="text-neutral-400 italic"> ({AGE_TAG[m.ageCategory]})</span>
                                                        )}
                                                    </span>
                                                    <span className="text-neutral-400 text-xs truncate max-w-[40%] text-right">{familyName(m.familyId)}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {unassigned.length > 0 && (
                    <div className="mt-8 border-t border-neutral-300 pt-4 break-inside-avoid">
                        <h2 className="font-serif text-lg mb-2">Sin asignar ({unassigned.length})</h2>
                        <p className="text-sm text-neutral-600">
                            {unassigned.map((u) => `${u.name} ${u.lastName}`).join(" · ")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
