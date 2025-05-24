import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const requestUrl = new URL(request.url)
        const code = requestUrl.searchParams.get('code')
        const next = requestUrl.searchParams.get('next') || '/account'

        if (!code) {
            return NextResponse.redirect(new URL('/auth/signin?error=No code provided', request.url))
        }

        const supabase = createRouteHandlerClient({ cookies })
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('Auth error:', error)
            return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url))
        }

        // URL to redirect to after sign in process completes
        return NextResponse.redirect(new URL(next, request.url))
    } catch (error) {
        console.error('Callback error:', error)
        return NextResponse.redirect(new URL('/auth/signin?error=An unexpected error occurred', request.url))
    }
} 