import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  UserIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Portfolio', href: '/portfolio', icon: DocumentTextIcon },
  { name: 'My Profile', href: '/profile', icon: UserIcon },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/signin')
      }
    }
    checkSession()
  }, [router, supabase])

  const handleNavigation = async (href) => {
    setIsNavigating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.push(href)
    } else {
      router.push('/auth/signin')
    }
    setIsNavigating(false)
  }

  return (
    <div className="flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center justify-center h-16">
        <h1 className="text-gray-700 text-2xl font-bold">
          <span className="md:group-hover:hidden">ZD</span>
          <span className="hidden md:group-hover:inline">ZimDiaspora</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavigation(item.href)}
            disabled={isNavigating}
            className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md ${
              pathname === item.href
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <item.icon className={`h-8 w-8 ${
              pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
            }`} />
            <span className="hidden md:group-hover:inline ml-3">
              {item.name}
            </span>
          </button>
        ))}
      </nav>
      {/* Sign Out Button */}
      <div className="relative md:absolute md:bottom-4 md:left-4 md:right-4">
        <button
          className="inline-flex px-4 py-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors items-center justify-center md:justify-start"
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/auth/signin')
          }}
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          <span className="hidden md:group-hover:inline ml-3">Sign Out</span>
        </button>
      </div>
    </div>
  )
} 