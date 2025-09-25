'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Building,
  MapPin,
  Brain,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Properties', href: '/dashboard/properties', icon: Building },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Itinerary Planner', href: '/dashboard/hunts', icon: MapPin },
  { name: 'AI Consultant', href: '/dashboard/consultant', icon: Brain },
  { name: 'Memory Packages', href: '/dashboard/memories', icon: Camera },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      <div className="lg:hidden fixed inset-0 z-40 bg-charcoal-600/75" aria-hidden="true" />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 flex flex-col bg-cream-50 border-r border-tan-200 transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white">
                <Image
                  src="/beaver-samples/LOGO.png"
                  alt="HostBuddies logo"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-xl font-bold text-charcoal-900">HostBuddies</span>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-tan-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-charcoal-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-charcoal-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-sm"
                    : "text-charcoal-700 hover:bg-tan-100 hover:text-charcoal-900"
                )}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0 w-5 h-5 mr-3 transition-colors",
                    isActive ? "text-white" : "text-charcoal-400 group-hover:text-charcoal-600",
                    collapsed && "mr-0"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        {!collapsed && (
            <div className="p-4 border-t border-tan-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-tan-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-charcoal-700">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal-900 truncate">
                  Dashboard User
                </p>
                <p className="text-xs text-charcoal-500 truncate">
                  Manage your properties
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
