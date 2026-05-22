// Helpers de dinero. Toda la app guarda importes en CENTAVOS (entero) para
// evitar errores de coma flotante; aquí se formatea/parsea a/desde pesos (ARS).

const FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea centavos a "$ 1.234,56" (ARS, es-AR). */
export function formatMoney(cents: number | null | undefined): string {
  return FORMATTER.format((cents ?? 0) / 100);
}

/**
 * Convierte pesos (lo que escribe el usuario) a centavos enteros.
 * Acepta un number o un string. En string admite tanto coma como punto como
 * separador decimal y miles ("1.234,56", "1234.56", "1234,5", "1234").
 * Devuelve un entero >= 0 redondeado; entrada inválida → 0.
 */
export function pesosToCents(value: number | string): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
  }
  let s = value.trim().replace(/[^\d.,-]/g, "");
  if (!s) return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  // El separador decimal es el último que aparezca; el otro son miles.
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");   // es-AR: "1.234,56"
    } else {
      s = s.replace(/,/g, "");                        // en: "1,234.56"
    }
  } else if (lastComma > -1) {
    s = s.replace(/\./g, "").replace(",", ".");       // solo coma decimal
  }
  // solo punto (o sin separador): ya es parseable

  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Centavos → número en pesos (para precargar un <input type="number">). */
export function centsToPesos(cents: number | null | undefined): number {
  return (cents ?? 0) / 100;
}
