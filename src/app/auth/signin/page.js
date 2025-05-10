'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
export default function SignIn() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/account')
      }
      setIsLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const user = session.user
          const fullName = user.user_metadata.full_name || user.user_metadata.name

          if (user && fullName) {
            await supabase.from('profiles').upsert({
              id: user.id,
              full_name: fullName,
              email: user.email,
            })
          }

          router.replace('/account')
        }
      }
    )

    checkUser()
    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleSubmit = async () => {
    setError(null)

    if (!email || !password || (isSignUp && !fullName)) {
      setError('Please fill in all required fields.')
      return
    }

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-center">
          {isSignUp ? 'Create an Account' : 'Sign In'}
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {isSignUp && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-gray-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>

        {/* <div className="text-center text-gray-500 text-sm">OR</div>
        
        <Auth
          supabaseClient={supabase}
          providers={['google']}
          onlyThirdPartyProviders
          redirectTo={process.env.NEXT_PUBLIC_SITE_URL 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
            : `${window.location.origin}/auth/callback`}
          onAuthSuccess={() => {
            router.refresh()
          }}
        /> */}
      </div>
    </div>
  )
}
