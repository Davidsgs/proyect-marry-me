import { STORY_PHOTOS } from "@/lib/wedding";
import { cachedConfig } from "@/lib/data";
import { Arch, Polaroid, Sprig } from "@/components/Brand";
import { BotanicalShadow } from "@/components/BotanicalShadow";
import TypedStory from "./TypedStory";

// «Nuestra historia» (página 3 del manual): arco crema con el texto y polaroids
// inclinados a los lados. Solo se renderiza en /dashboard (con sesión); el texto
// vive en la base (Ajustes, clave "story") y las fotos en public/privado/,
// protegido por src/proxy.ts. Sin texto, la sección no aparece.
const TILT = [-8, 7, -4];

export default async function OurStory() {
    const story = (await cachedConfig("story"))?.trim();
    if (!story) return null;
    const paragraphs = story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const [first, second, third] = STORY_PHOTOS;
    return (
        <section aria-labelledby="historia" className="relative overflow-hidden bg-rubor text-tinta">
            <BotanicalShadow variant="orquidea" sway className="absolute -top-24 -left-32 w-[30rem] max-w-[90vw] -scale-x-100 text-rosa-profundo/20" />
            <BotanicalShadow variant="espiga" className="absolute -bottom-20 -right-20 w-[24rem] max-w-[70vw] text-rosa-profundo/20" />

            <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 lg:py-8 short:py-4">
                <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,34rem)_1fr]">
                    {first && <Polaroid {...first} rotate={TILT[0]} className="mg-pop mg-d-6 mx-auto w-48 sm:w-56 lg:-mr-10 lg:mt-24 relative z-10" />}
                    {/* Sin fotos, el arco ocupa las tres columnas y el texto va a dos
                        columnas en escritorio, para que el paso entre en la pantalla. */}
                    <Arch
                        as="article"
                        className={`mg-rise ${first ? "lg:col-start-2" : "lg:col-span-3 mx-auto w-full max-w-3xl"}`}
                        innerClassName="text-center short:pt-12 short:pb-5"
                    >
                        <h2 id="historia" className="mg-mask mg-d-2 font-serif text-5xl sm:text-6xl short:text-4xl leading-display text-oliva-profundo">Nuestra historia</h2>
                        <Sprig className="mg-grow mg-d-4 mx-auto mt-5 short:mt-3 text-rosa-profundo" />
                        <TypedStory
                            paragraphs={paragraphs}
                            className={`mt-5 short:mt-3 space-y-4 short:space-y-2 font-text text-base sm:text-lg short:text-item leading-relaxed text-pretty ${first ? "" : "lg:columns-2 lg:gap-12"}`}
                        />
                    </Arch>
                    {second && <Polaroid {...second} rotate={TILT[1]} tone="oliva" className="mg-pop mg-d-8 mx-auto w-48 sm:w-56 lg:-ml-10 lg:-mt-24 relative z-10" />}
                </div>
                {third && <Polaroid {...third} rotate={TILT[2]} tone="crema" className="mg-pop mg-d-10 mx-auto mt-10 w-52 sm:w-64" />}
            </div>
        </section>
    );
}
