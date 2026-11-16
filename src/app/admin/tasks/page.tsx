import { auth } from "@/auth";
import { PageHeader } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getTasks } from "@/app/actions/tasks";
import TaskForm from "./_components/TaskForm";
import TaskList from "./_components/TaskList";
import { TasksSyncProvider } from "./_components/TasksSync";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const session = await auth();
    const perms = session?.user?.permissions;

    if (!hasPermission(perms, "tasks.read")) {
        redirect("/admin");
    }

    const allTasks = await getTasks();
    const canWrite = hasPermission(perms, "tasks.write");

    return (
        <TasksSyncProvider tasks={allTasks}>
        <div className="max-w-4xl mx-auto space-y-10">
            <PageHeader title="Tareas" description="Organiza las tareas pendientes para que todo esté listo para el gran día." />

            {/* Task creation form */}
            {canWrite && <TaskForm />}

            <TaskList canWrite={canWrite} />
        </div>
        </TasksSyncProvider>
    );
}
