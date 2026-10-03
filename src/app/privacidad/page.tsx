import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "Política de privacidad | David & Rocío",
    description: "Qué datos usa la invitación de la boda de David y Rocío y para qué.",
};

export default function PrivacidadPage() {
    return (
        <LegalPage title="Política de privacidad">
            <section>
                <p>
                    Esta web (<strong>davidyrocio.wedding</strong>) es la invitación privada de la boda de David y Rocío.
                    La organizan los propios novios, que son los responsables de los datos que aquí se tratan.
                    Aquí te contamos qué datos usamos, para qué y cómo puedes pedir que los cambiemos o los borremos.
                </p>
            </section>

            <section>
                <h2>Qué datos usamos</h2>
                <ul>
                    <li><strong>Los que cargamos nosotros</strong> para preparar la invitación: nombre, apellido, correo electrónico, familia a la que perteneces y si eres adulto, niño o bebé.</li>
                    <li><strong>Tu respuesta</strong>: si asistirás a la boda y quién de tu familia viene.</li>
                    <li><strong>La organización del día</strong>: la mesa que te asignamos.</li>
                    <li>
                        <strong>Al iniciar sesión con Google</strong>, Google nos confirma tu nombre y tu correo electrónico.
                        Solo los usamos para comprobar que estás en la lista de invitados. No accedemos a tus contactos, correos, archivos ni a ningún otro dato de tu cuenta de Google.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Para qué los usamos</h2>
                <ul>
                    <li>Dejarte entrar solo a ti (y a los demás invitados) a la invitación.</li>
                    <li>Registrar quién asistirá y organizar las mesas, el menú y el día de la boda.</li>
                    <li>Mostrarte tu mesa y con quién la compartes.</li>
                </ul>
                <p>No usamos tus datos para publicidad, no los vendemos y no los cedemos a terceros con fines comerciales.</p>
            </section>

            <section>
                <h2>Quién más puede verlos</h2>
                <ul>
                    <li>Los novios y las personas que nos ayudan a organizar la boda (familiares o proveedores como el salón o el catering), solo en la medida en que lo necesiten para su tarea.</li>
                    <li>Los demás miembros de tu familia ven la respuesta de la familia, y quienes comparten tu mesa ven tu nombre.</li>
                    <li>
                        Los proveedores técnicos que hacen funcionar la web: el alojamiento de la página, la base de datos (Turso) y el inicio de sesión (Google).
                        Algunos de ellos guardan la información en servidores fuera de Argentina, por ejemplo en Estados Unidos.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Cookies</h2>
                <p>
                    Solo usamos las cookies necesarias para mantener tu sesión iniciada. No usamos cookies de publicidad ni de analítica.
                </p>
            </section>

            <section>
                <h2>Cuánto tiempo los guardamos</h2>
                <p>
                    Mientras dure la organización de la boda. Después de la celebración los borraremos, salvo que nos pidas lo contrario.
                    También puedes pedirnos que los borremos antes.
                </p>
            </section>

            <section>
                <h2>Tus derechos</h2>
                <p>
                    Puedes pedirnos en cualquier momento ver los datos que tenemos sobre ti, corregirlos o borrarlos, escribiendo a{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Te responderemos lo antes posible.
                </p>
                <p>
                    Si estás en Argentina, también puedes acudir a la Agencia de Acceso a la Información Pública, autoridad de control de la Ley 25.326 de Protección de los Datos Personales.
                </p>
            </section>

            <section>
                <h2>Contacto</h2>
                <p>
                    Para cualquier duda sobre esta política: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </p>
            </section>
        </LegalPage>
    );
}
