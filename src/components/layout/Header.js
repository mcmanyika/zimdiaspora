'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

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
  }, [supabase, isDropdownOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
        Welcome to ZimDiaspora
        </h1>
        
        <div className="relative">
          <button
            data-dropdown-button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-2"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
              {!loading && user.user_metadata.name?.[0]?.toUpperCase() }
              </span>
            </div>
          </button>

          {isDropdownOpen && (
            <div
              data-dropdown
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <div className="block w-full text-left px-4 py-2 text-sm text-gray-700">
              
              </div><button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Link href="/profile">Hi, {user?.user_metadata.name}</Link>
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