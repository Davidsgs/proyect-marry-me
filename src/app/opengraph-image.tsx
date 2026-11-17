import { ImageResponse } from "next/og";
import { D_PATH, R_PATH } from "@/components/Monogram";
import { WEDDING_DATE_LABEL } from "@/lib/wedding";

// Vista previa del enlace (WhatsApp, Telegram…): monograma, nombres y fecha,
// lo mismo que ya muestra el login público. Nada privado: ni lugar ni fotos.
export const alt = "Boda de David y Rocío";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TEXT = `David y Rocío Boda ${WEDDING_DATE_LABEL}·`;

// Marcellus desde Google Fonts (TTF, solo los caracteres usados). Sin red, la
// imagen se genera con la tipografía por defecto.
async function marcellus(): Promise<ArrayBuffer | null> {
    try {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Marcellus&text=${encodeURIComponent(TEXT)}`)).text();
        const url = css.match(/src: url\((.+?)\) format/)?.[1];
        return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
        return null;
    }
}

const monogram = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="35 136 520 320"><path fill="#828a6c" d="${D_PATH}"/><path fill="#df8e86" d="${R_PATH}"/></svg>`,
)}`;

export default async function OpengraphImage() {
    const font = await marcellus();
    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#d9a3a0" }}>
                <div
                    style={{
                        width: 620,
                        height: 560,
                        marginTop: 70,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f2eee8",
                        borderTopLeftRadius: 310,
                        borderTopRightRadius: 310,
                        borderBottomLeftRadius: 32,
                        borderBottomRightRadius: 32,
                        color: "#55634f",
                        fontFamily: font ? "Marcellus" : undefined,
                        paddingTop: 60,
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={monogram} width={208} height={128} alt="" />
                    <div style={{ marginTop: 28, fontSize: 84, lineHeight: 1 }}>David y Rocío</div>
                    <div style={{ marginTop: 22, fontSize: 34, color: "#364033" }}>{`Boda · ${WEDDING_DATE_LABEL}`}</div>
                </div>
            </div>
        ),
        { ...size, fonts: font ? [{ name: "Marcellus", data: font, weight: 400, style: "normal" }] : [] },
    );
}
