"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-neutral-700 transition-colors font-sans text-xs tracking-widest uppercase font-medium"
        >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
        </button>
    );
}
