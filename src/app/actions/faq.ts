"use server";

import { db } from "@/db";
import { faqItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { FAQ_ANSWER_MAX, FAQ_QUESTION_MAX } from "@/lib/wedding";

// Preguntas y respuestas: se editan en Ajustes (settings.write) y se muestran en
// la invitación. Las lecturas van por cachedFaq (src/lib/data.ts).
export type FaqItem = typeof faqItems.$inferSelect;

type Input = { question: string; answer: string };

async function requireWrite() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "settings.write")) throw new Error("Sin permisos");
}

function invalidate() {
    updateTag("faq");
    revalidatePath("/admin/settings");
    revalidatePath("/dashboard");
}

function clean(data: Input) {
    const question = data.question.trim().slice(0, FAQ_QUESTION_MAX);
    const answer = data.answer.trim().slice(0, FAQ_ANSWER_MAX);
    if (!question) throw new Error("Falta la pregunta");
    if (!answer) throw new Error("Falta la respuesta");
    return { question, answer };
}

export async function createFaqItem(data: Input) {
    await requireWrite();
    const values = clean(data);
    const max = await db.select({ v: sql<number>`COALESCE(MAX(${faqItems.sortOrder}), -1)` }).from(faqItems).get();
    await db.insert(faqItems).values({ ...values, sortOrder: (max?.v ?? -1) + 1 });
    invalidate();
}

export async function updateFaqItem(id: number, data: Input) {
    await requireWrite();
    await db.update(faqItems).set(clean(data)).where(eq(faqItems.id, id));
    invalidate();
}

export async function deleteFaqItem(id: number) {
    await requireWrite();
    await db.delete(faqItems).where(eq(faqItems.id, id));
    invalidate();
}

export async function reorderFaqItems(orderedIds: number[]) {
    await requireWrite();
    if (orderedIds.length > 0) {
        const [first, ...rest] = orderedIds.map((itemId, i) =>
            db.update(faqItems).set({ sortOrder: i }).where(eq(faqItems.id, itemId)),
        );
        await db.batch([first, ...rest]);
    }
    invalidate();
}
