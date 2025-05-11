import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Get the current pathname
    const path = req.nextUrl.pathname

    // Always allow access to auth-related paths and static assets
    if (path.startsWith('/auth/') ||
        path.startsWith('/_next') ||
        path.startsWith('/api') ||
        path === '/') {
        return res
    }

    // For all other routes, check session but don't redirect immediately
    const { data: { session } } = await supabase.auth.getSession()

    // If no session and trying to access protected route, redirect to signin
    if (!session && !path.startsWith('/auth/')) {
        const redirectUrl = new URL('/auth/signin', req.url)
        redirectUrl.searchParams.set('redirectedFrom', path)
        return NextResponse.redirect(redirectUrl)
    }

    return res
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
} 