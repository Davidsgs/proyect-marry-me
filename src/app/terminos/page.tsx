import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "Términos y condiciones | David & Rocío",
    description: "Condiciones de uso de la invitación de la boda de David y Rocío.",
};

export default function TerminosPage() {
    return (
        <LegalPage title="Términos y condiciones">
            <section>
                <p>
                    Estas condiciones se aplican al uso de <strong>davidyrocio.wedding</strong>, la invitación privada de la boda de David y Rocío.
                    Al entrar y usar la web aceptas estas condiciones.
                </p>
            </section>

            <section>
                <h2>Para qué es esta web</h2>
                <p>
                    Es una invitación personal y sin fines comerciales. Sirve para consultar los datos de la boda, confirmar tu asistencia y ver tu mesa.
                    El equipo organizador la usa además para preparar el día.
                </p>
            </section>

            <section>
                <h2>Acceso</h2>
                <ul>
                    <li>Solo pueden entrar las personas invitadas, con la cuenta de Google del correo que nos facilitaron.</li>
                    <li>El acceso es personal: no compartas tu sesión ni intentes entrar con la cuenta de otra persona.</li>
                    <li>Podemos retirar el acceso a quien haga un uso indebido de la web.</li>
                </ul>
            </section>

            <section>
                <h2>Confirmación de asistencia</h2>
                <ul>
                    <li>En cada familia, una persona (el delegado) responde por todos sus integrantes.</li>
                    <li>Puedes cambiar la respuesta hasta la fecha límite que figura en la invitación. Pasada esa fecha, cualquier cambio debe hablarse directamente con los novios.</li>
                    <li>Te pedimos que la respuesta sea lo más fiel posible: con ella organizamos mesas, menú y lugares.</li>
                </ul>
            </section>

            <section>
                <h2>Información de la boda</h2>
                <p>
                    Hacemos lo posible por mantener al día la fecha, el lugar, el horario y el resto de detalles.
                    Si algo cambia, lo actualizaremos en la web, así que te recomendamos revisarla antes del evento.
                </p>
            </section>

            <section>
                <h2>Contenido</h2>
                <p>
                    Los textos, el diseño y el monograma de la web pertenecen a los novios. No los uses fuera de esta invitación sin pedir permiso.
                </p>
            </section>

            <section>
                <h2>Disponibilidad</h2>
                <p>
                    La web se ofrece tal cual, de buena fe. Puede haber momentos en que no esté disponible o tenga errores; si notas algo raro, avísanos.
                </p>
            </section>

            <section>
                <h2>Privacidad</h2>
                <p>
                    Cómo tratamos tus datos se explica en la <Link href="/privacidad">Política de privacidad</Link>.
                </p>
            </section>

            <section>
                <h2>Cambios y contacto</h2>
                <p>
                    Podemos actualizar estas condiciones; la fecha de la última actualización figura arriba.
                    Para cualquier duda, escríbenos a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </p>
            </section>
        </LegalPage>
    );
}
