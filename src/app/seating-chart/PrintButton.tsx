"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-2 min-h-11 bg-primary text-on-primary px-5 rounded-xl shadow-sm hover:bg-[#4a5745] transition-colors font-sans text-sm font-medium"
        >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
        </button>
    );
}
