import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session } } = await supabase.auth.getSession()

    if (!session && req.nextUrl.pathname !== '/auth/signin') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    if (session && req.nextUrl.pathname === '/auth/signin') {
        const response = NextResponse.redirect(new URL('/', req.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
        return response
    }

    return res
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)',
    ],
} 