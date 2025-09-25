'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Search, 
  Plus,
  LogOut,
  User,
  Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@/lib/supabase-client'

export default function DashboardHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Don't render until user is loaded
  if (!user) {
    return (
      <header className="bg-cream-50 border-b border-tan-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="animate-pulse bg-tan-200 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-tan-200 h-8 w-8 rounded-full"></div>
          </div>
        </div>
      </header>
    )
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <header className="bg-cream-50 border-b border-tan-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Search */}
          <div className="flex flex-1 items-center">
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-charcoal-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-tan-300 rounded-lg text-sm placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-tan-500 focus:border-transparent"
                placeholder="Search properties, hunts..."
                type="search"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4 flex items-center space-x-4">
            {/* Add New Button */}
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-cream-50 bg-gradient-to-r from-tan-700 to-charcoal-800 hover:shadow-lg transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-charcoal-400 hover:text-gray-500 transition-colors">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-tan-100 transition-colors"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    className="w-8 h-8 rounded-full"
                    src={user.user_metadata.avatar_url}
                    alt={userName}
                  />
                ) : (
                  <div className="w-8 h-8 bg-charcoal-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-cream-50">{userInitial}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-charcoal-700 hidden lg:block">
                  {userName}
                </span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {user.email}
                    </div>
                    <button
                      onClick={() => router.push('/dashboard/profile')}
                      className="flex w-full items-center px-4 py-2 text-sm text-charcoal-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Your Profile
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/settings')}
                      className="flex w-full items-center px-4 py-2 text-sm text-charcoal-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center px-4 py-2 text-sm text-charcoal-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
