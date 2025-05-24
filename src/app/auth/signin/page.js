'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

function SignIn() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const [showVerifyEmailMessage, setShowVerifyEmailMessage] = useState(false)

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
      else {
        setShowVerifyEmailMessage(true)
        setEmail('')
        setPassword('')
        setFullName('')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
  }

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left: Illustration */}
        <div className="hidden md:flex items-center justify-center w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome Back</h1>
            <p className="text-gray-600">Join our community and start your journey today</p>
          </div>
        </div>
        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              {isSignUp ? 'Create an Account' : 'Sign In'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isSignUp ? 'Join us today' : 'Welcome back'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {showVerifyEmailMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              A verification email has been sent. Please check your inbox to verify your email address.
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition duration-200 font-medium text-sm"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-black transition duration-200"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SignIn;