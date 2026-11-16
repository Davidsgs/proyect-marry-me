import { STORY_PHOTOS } from "@/lib/wedding";
import { cachedConfig } from "@/lib/data";
import { Arch, Polaroid } from "@/components/Brand";
import { BotanicalShadow } from "@/components/BotanicalShadow";

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
            <BotanicalShadow variant="orquidea" className="absolute -top-24 -left-32 w-[30rem] max-w-[90vw] -scale-x-100 text-rosa-profundo/20" />
            <BotanicalShadow variant="espiga" className="absolute -bottom-20 -right-20 w-[24rem] max-w-[70vw] text-rosa-profundo/20" />

            <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-16 sm:py-24">
                <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,34rem)_1fr]">
                    {first && <Polaroid {...first} rotate={TILT[0]} className="mx-auto w-48 sm:w-56 lg:-mr-10 lg:mt-24 relative z-10" />}
                    <Arch as="article" className="lg:col-start-2" innerClassName="text-center">
                        <h2 id="historia" className="font-serif text-5xl sm:text-6xl leading-none text-oliva-profundo">Nuestra historia</h2>
                        <div className="mt-6 space-y-4 font-text text-base sm:text-lg leading-relaxed text-pretty">
                            {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                        </div>
                    </Arch>
                    {second && <Polaroid {...second} rotate={TILT[1]} tone="oliva" className="mx-auto w-48 sm:w-56 lg:-ml-10 lg:-mt-24 relative z-10" />}
                </div>
                {third && <Polaroid {...third} rotate={TILT[2]} tone="crema" className="mx-auto mt-10 w-52 sm:w-64" />}
            </div>
        </section>
    );
}
