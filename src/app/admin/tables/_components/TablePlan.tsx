"use client";

import { useMemo, useState, useTransition } from "react";
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDraggable,
    type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { tables as tablesTable, users as usersTable } from "@/db/schema";
import { updateTablePosition } from "@/app/actions/tables";
import { GripVertical, Move } from "lucide-react";

type Table = typeof tablesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;

const NODE_W = 180;
const COLS = 4;
const GAP_X = 200;
const GAP_Y = 170;
const PAD = 20;

function fallbackPos(index: number) {
    return { x: (index % COLS) * GAP_X + PAD, y: Math.floor(index / COLS) * GAP_Y + PAD };
}

export default function TablePlan({
    tables,
    membersByTable,
}: {
    tables: Table[];
    membersByTable: Map<number, User[]>;
}) {
    const [, startTransition] = useTransition();

    const positions = useMemo(() => {
        const map = new Map<number, { x: number; y: number }>();
        tables.forEach((t, i) => {
            map.set(t.id, t.posX != null && t.posY != null ? { x: t.posX, y: t.posY } : fallbackPos(i));
        });
        return map;
    }, [tables]);

    const [overrides, setOverrides] = useState<Map<number, { x: number; y: number }>>(new Map());

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    function posOf(id: number) {
        return overrides.get(id) ?? positions.get(id) ?? { x: PAD, y: PAD };
    }

    function onDragEnd(event: DragEndEvent) {
        const id = Number(String(event.active.id).replace("plan-", ""));
        const base = posOf(id);
        const x = Math.max(0, base.x + event.delta.x);
        const y = Math.max(0, base.y + event.delta.y);
        setOverrides((prev) => new Map(prev).set(id, { x, y }));
        startTransition(() => updateTablePosition(id, x, y));
    }

    const rows = Math.ceil(tables.length / COLS);
    const canvasMinHeight = Math.max(500, rows * GAP_Y + PAD * 2);

    if (tables.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
                <p className="text-on-surface-variant font-sans text-sm">Crea mesas para colocarlas en el plano.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-[11px] text-on-surface-variant mb-3 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" /> Arrastra cada mesa para recrear la distribución del salón. La posición se guarda sola.
            </p>
            <div className="overflow-auto rounded-2xl bg-surface-container-low/40 shadow-inner">
                <DndContext id="tables-plan" sensors={sensors} onDragEnd={onDragEnd}>
                    <div className="relative" style={{ minHeight: canvasMinHeight, minWidth: COLS * GAP_X + PAD * 2 }}>
                        {tables.map((table) => (
                            <PlanNode
                                key={table.id}
                                table={table}
                                pos={posOf(table.id)}
                                count={membersByTable.get(table.id)?.length ?? 0}
                            />
                        ))}
                    </div>
                </DndContext>
            </div>
        </div>
    );
}

function PlanNode({ table, pos, count }: { table: Table; pos: { x: number; y: number }; count: number }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `plan-${table.id}` });
    const over = count > table.capacity;

    const style: React.CSSProperties = {
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: NODE_W,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`select-none touch-none cursor-grab active:cursor-grabbing bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${isDragging ? "ring-2 ring-primary/50 shadow-lg" : ""}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h4 className="font-serif text-base text-on-surface leading-tight truncate">Mesa {table.number}</h4>
                    {table.name && <p className="text-[11px] text-on-surface-variant italic truncate">{table.name}</p>}
                </div>
                <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/40 flex-shrink-0 mt-1" />
            </div>
            <div className="mt-3 flex items-center justify-center">
                <span className={`text-[11px] font-sans tracking-widest uppercase font-medium px-3 py-1 rounded-full ${over ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
                    {count}/{table.capacity} asientos
                </span>
            </div>
        </div>
    );
}
