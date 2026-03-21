import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
    const isAuth = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.startsWith('/login');
    const role = req.auth?.user?.role;

    if (!isAuth && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isAuth && isLoginPage) {
        // If authenticated and tries to go to login, redirect based on role
        if (role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Role-based route protection
    if (isAuth) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');

        if (isAdminRoute && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        if (isDashboardRoute && role === 'ADMIN') {
            // Admins probably don't need to see dashboard, but allow or redirect?
            // Actually they can visit dashboard or redirect to admin. Let's redirect to admin for now, or allow them.
            // Let's allow admins to see dashboard if they want, or redirect to admin if strictly separated. Let's just redirect to admin for simplicity.
            return NextResponse.redirect(new URL('/admin', req.url));
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
    ],
};
