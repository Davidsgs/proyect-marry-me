import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
    const isAuth = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.startsWith('/login');

    if (!isAuth && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isAuth && isLoginPage) {
        return NextResponse.redirect(new URL('/', req.url));
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
    ],
};
