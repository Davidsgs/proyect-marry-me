import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
    const isAuth = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.startsWith('/login');
    // Páginas legales: públicas (Google las revisa sin sesión).
    // Imagen de vista previa de enlaces: la piden WhatsApp y similares sin sesión.
    const isPublicPage = ['/privacidad', '/terminos'].includes(req.nextUrl.pathname)
        || req.nextUrl.pathname.startsWith('/opengraph-image');

    if (isPublicPage) {
        return NextResponse.next();
    }
    const permissions = req.auth?.user?.permissions;
    const hasAdminDashboard = permissions?.includes('admin.dashboard');

    if (!isAuth && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isAuth && isLoginPage) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // Permission-based route protection
    if (isAuth) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        const isWelcomeRoute = req.nextUrl.pathname.startsWith('/welcome');

        if (isAdminRoute && !hasAdminDashboard) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        if (isWelcomeRoute && !hasAdminDashboard) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - any static asset files (images, fonts, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:jpg|jpeg|gif|png|svg|webp|ico|woff2?|eot|ttf|otf)).*)',
        // Fotos de la pareja e ilustración: solo con sesión. El patrón de arriba
        // deja fuera las imágenes; este las vuelve a incluir para public/privado/.
        // No servirlas con next/image: /_next/image queda fuera de este control.
        '/privado/:path*',
    ],
};
