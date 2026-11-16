"use client";

import { createContext, useContext } from "react";
import { createTask, deleteTask, toggleTask, updateTask } from "@/app/actions/tasks";
import { tempId, useOptimisticState } from "@/app/admin/_components/optimistic";
import type { Task } from "./TaskItem";
import type { Priority } from "@/lib/priority";

// Lista de tareas compartida entre el formulario y la lista, con cambios optimistas:
// añadir, completar, editar y borrar se ven al momento; si el servidor falla, se deshace.
type TaskData = { title: string; description: string; dueDate?: string; priority: Priority };
type TaskEdit = { title: string; description: string; dueDate: string | null; priority: Priority };

type Ctx = {
    tasks: Task[];
    add: (data: TaskData) => Promise<boolean>;
    toggle: (task: Task) => Promise<boolean>;
    update: (task: Task, data: TaskEdit) => Promise<boolean>;
    remove: (task: Task) => Promise<boolean>;
};

const TasksCtx = createContext<Ctx | null>(null);

const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export function TasksSyncProvider({ tasks: serverTasks, children }: { tasks: Task[]; children: React.ReactNode }) {
    const [tasks, mutate] = useOptimisticState(serverTasks);

    const value: Ctx = {
        tasks,
        add: (data) =>
            mutate(
                (s) => [...s, {
                    id: tempId(), title: data.title, description: data.description, dueDate: data.dueDate ?? null, priority: data.priority,
                    isCompleted: false, completedAt: null, completedBy: null, createdBy: null,
                    createdAt: nowSql(), updatedAt: nowSql(), completedByName: null,
                }],
                () => createTask(data),
                { ok: "Tarea añadida", error: "No se pudo añadir la tarea" },
            ),
        toggle: (task) =>
            mutate(
                (s) => s.map((t) => t.id === task.id ? { ...t, isCompleted: !t.isCompleted, completedAt: t.isCompleted ? null : nowSql() } : t),
                () => toggleTask(task.id),
                { ok: task.isCompleted ? "Tarea reabierta" : "Tarea completada", error: "No se pudo actualizar la tarea" },
            ),
        update: (task, data) =>
            mutate(
                (s) => s.map((t) => t.id === task.id ? { ...t, ...data } : t),
                () => updateTask(task.id, data),
                { ok: "Tarea guardada", error: "No se pudo guardar la tarea" },
            ),
        remove: (task) =>
            mutate(
                (s) => s.filter((t) => t.id !== task.id),
                () => deleteTask(task.id),
                { ok: "Tarea eliminada", error: "No se pudo eliminar la tarea" },
            ),
    };

    return <TasksCtx.Provider value={value}>{children}</TasksCtx.Provider>;
}

export function useTasks() {
    const ctx = useContext(TasksCtx);
    if (!ctx) throw new Error("useTasks debe usarse dentro de <TasksSyncProvider>");
    return ctx;
}
