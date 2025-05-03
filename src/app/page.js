'use client'

import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline'
import Dashboard from '../app/(dashboard)/index'

export default function Home() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="group fixed md:static left-0 bottom-0 md:top-0 h-16 md:h-screen w-full md:w-16 hover:md:w-64 transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-t md:border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-around md:justify-center">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 w-full transition-all duration-300 ease-in-out">
        <Dashboard />
      </main>
    </div>
  );
}
