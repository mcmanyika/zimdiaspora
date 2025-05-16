'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalState } from '../../store'
import { getSupabaseClient } from '../../lib/supabase/client'

function Header() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [appName] = useGlobalState('appName')
  const [user, setUser] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hasPayment, setHasPayment] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error getting user:', error.message)
          return
        }
        console.log('User session:', user)
        setUser(user)

        // Check if user has any completed payments
        if (user) {
          const { data: investments, error: investmentsError } = await supabase
            .from('investments')
            .select('status')
            .eq('investor_id', user.id)
            .eq('status', 'COMPLETED')
            .limit(1)

          if (investmentsError) {
            console.error('Error checking investments:', investmentsError)
            return
          }

          setHasPayment(investments && investments.length > 0)
        }
      } catch (err) {
        console.error('Unexpected error getting user:', err)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('[data-dropdown]')
      const button = document.querySelector('[data-dropdown-button]')
      if (
        isDropdownOpen &&
        dropdown &&
        button &&
        !dropdown.contains(event.target) &&
        !button.contains(event.target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isDropdownOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">
          Hello <label className="font-thin">,{user?.user_metadata?.full_name}</label> 
        </h1>

        <div className="relative">
          <button
            data-dropdown-button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-2"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.email ? user.email[0].toUpperCase() : '?'}
              </span>
            </div>
          </button>

          {isDropdownOpen && (
            <div
              data-dropdown
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Link href="/profile">My Profile</Link>
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header