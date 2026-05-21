import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getTasks } from "@/app/actions/tasks";
import TaskForm from "./_components/TaskForm";
import TaskItem from "./_components/TaskItem";
import { ChevronDown } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const session = await auth();
    const perms = session?.user?.permissions;

    if (!hasPermission(perms, "tasks.read")) {
        redirect("/admin");
    }

    const allTasks = await getTasks();
    const pendingTasks = allTasks.filter(t => !t.isCompleted);
    const completedTasks = allTasks.filter(t => t.isCompleted);
    const canWrite = hasPermission(perms, "tasks.write");

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center pb-4">
                <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Tareas</h1>
                <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
                    Organiza las tareas pendientes para que todo esté listo para el gran día.
                </p>
            </div>

            {/* Task creation form */}
            {canWrite && <TaskForm />}

            {/* Pending tasks */}
            <div className="space-y-3">
                <h3 className="text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Pendientes
                    <span className="text-on-surface-variant/50">({pendingTasks.length})</span>
                </h3>
                {pendingTasks.length === 0 ? (
                    <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
                        <p className="text-on-surface-variant font-sans text-sm">🎉 ¡No hay tareas pendientes!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pendingTasks.map(task => (
                            <TaskItem key={task.id} task={task} canWrite={canWrite} />
                        ))}
                    </div>
                )}
            </div>

            {/* Completed tasks (collapsible) */}
            {completedTasks.length > 0 && (
                <details className="group">
                    <summary className="cursor-pointer text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        Completadas
                        <span className="text-on-surface-variant/50">({completedTasks.length})</span>
                    </summary>
                    <div className="space-y-2 mt-3">
                        {completedTasks.map(task => (
                            <TaskItem key={task.id} task={task} canWrite={canWrite} />
                        ))}
                    </div>
                </details>
            )}

            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">David &amp; Rocio · 03 de Abril, 2026</p>
            </div>
        </div>
    );
}
