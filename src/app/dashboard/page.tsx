import Link from 'next/link'
import { 
  Building, 
  MapPin, 
  Camera, 
  Users, 
  TrendingUp, 
  Star,
  Plus,
  BarChart3,
  DollarSign,
  MessageSquare,
  Calendar,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function DashboardOverview() {
  const supabase = await createServerSupabaseClient()
  
  // Get real user data and connection status
  let propertiesCount = 0
  let itinerariesCount = 0
  let memoryPackagesCount = 0
  let properties: any[] = []
  let userName = 'Host'
  let connectedPlatforms: any[] = []
  let hasRealData = false
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get user's display name
    if (user) {
      userName = user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 'Host'
    }
    
    if (user) {
      // Get real data from database
      const [propertiesResult, itinerariesResult, memoriesResult, platformsResult] = await Promise.all([
        supabase.from('properties').select('*').eq('user_id', user.id),
        supabase.from('scavenger_hunts').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('memory_packages').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('platform_integrations').select('*').eq('user_id', user.id)
      ])
      
      properties = propertiesResult.data || []
      propertiesCount = properties.length
      itinerariesCount = itinerariesResult.count || 0
      memoryPackagesCount = memoriesResult.count || 0
      connectedPlatforms = platformsResult.data || []
      
      // Check if user has any real data
      hasRealData = propertiesCount > 0 || connectedPlatforms.length > 0
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Continue with default values
  }

  // Real data stats - only show if user has connected platforms or data
  const realStats = hasRealData ? [
    { 
      name: 'Properties', 
      value: propertiesCount.toString(), 
      icon: Building,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    },
    { 
      name: 'Itineraries', 
      value: itinerariesCount.toString(), 
      icon: MapPin,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    },
    { 
      name: 'Memory Packages', 
      value: memoryPackagesCount.toString(), 
      icon: Camera,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    },
    { 
      name: 'Connected Platforms', 
      value: connectedPlatforms.length.toString(), 
      icon: BarChart3,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    },
  ] : []

  // Connection prompts for real-time data
  const connectionPrompts = [
    {
      name: 'Connect Airbnb',
      description: 'Sync your Airbnb listings to get real revenue and booking data',
      icon: Building,
      href: '/dashboard/bookings/connect',
      status: connectedPlatforms.some(p => p.platform_name === 'airbnb') ? 'connected' : 'not_connected',
      color: 'bg-gradient-to-r from-pink-500 to-pink-600'
    },
    {
      name: 'Connect VRBO',
      description: 'Import your VRBO properties for comprehensive analytics',
      icon: Building,
      href: '/dashboard/bookings/connect',
      status: connectedPlatforms.some(p => p.platform_name === 'vrbo') ? 'connected' : 'not_connected',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      name: 'Add Manual Bookings',
      description: 'Input your bookings manually to track revenue and occupancy',
      icon: Calendar,
      href: '/dashboard/bookings',
      status: 'available',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      name: 'Import Reviews',
      description: 'Connect review platforms to track guest satisfaction',
      icon: Star,
      href: '/dashboard/settings',
      status: 'coming_soon',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    }
  ]

  const quickActions = [
    {
      name: 'Add Property',
      description: 'Set up a new property with AI host',
      href: '/dashboard/properties/new',
      icon: Building,
      color: 'bg-gradient-to-r from-slate-600 to-slate-700'
    },
    {
      name: 'Create Itinerary',
      description: 'Design personalized guest itineraries',
      href: '/dashboard/hunts/new',
      icon: MapPin,
      color: 'bg-gradient-to-r from-slate-700 to-slate-800'
    },
    {
      name: 'Memory Package',
      description: 'Create guest keepsake experiences',
      href: '/dashboard/memories/new',
      icon: Camera,
      color: 'bg-gradient-to-r from-slate-800 to-slate-900'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Professional Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-charcoal-900">Welcome back, {userName}!</h1>
          <p className="mt-3 text-lg text-charcoal-600">
            Here's your AI-powered hosting performance at a glance.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select className="block w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Link>
        </div>
      </div>

      {/* Real-time Data Section */}
      {hasRealData ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Real-time Data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Live metrics from your connected platforms and properties
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {realStats.map((stat) => (
                <div
                  key={stat.name}
                  className="relative bg-gray-50 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div>
                    <div className={`absolute ${stat.bgColor} rounded-xl p-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                  </div>
                  <div className="ml-16 pb-6 flex items-baseline justify-between sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Real-time Data Yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Connect your platforms or add properties to see live analytics and performance metrics.
            </p>
          </div>
        </div>
      )}

      {/* Data Connection Prompts */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Connect Your Data Sources</h3>
          <p className="mt-1 text-sm text-gray-500">
            Link your platforms to get real-time analytics and AI-powered insights
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {connectionPrompts.map((prompt) => (
              <Link
                key={prompt.name}
                href={prompt.href}
                className="group relative bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-slate-300"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className={`rounded-lg inline-flex p-3 ${prompt.color} text-white group-hover:scale-110 transition-transform`}>
                      <prompt.icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-slate-600 transition-colors">
                        {prompt.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prompt.status === 'connected' 
                          ? 'bg-green-100 text-green-800' 
                          : prompt.status === 'not_connected'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prompt.status === 'connected' ? 'Connected' : 
                         prompt.status === 'not_connected' ? 'Connect' : 
                         prompt.status === 'coming_soon' ? 'Coming Soon' : 'Available'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {prompt.description}
                    </p>
                  </div>
                </div>
                <span className="absolute top-6 right-6 text-gray-300 group-hover:text-slate-500 transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started with setting up your AI hosting experience
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="group relative bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-slate-300"
              >
                <div>
                  <span className={`rounded-lg inline-flex p-3 ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-slate-600 transition-colors">
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
                <span
                  className="absolute top-6 right-6 text-gray-300 group-hover:text-slate-500 transition-colors"
                  aria-hidden="true"
                >
                  <Plus className="h-6 w-6" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Getting Started Guide */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
            <p className="mt-1 text-sm text-gray-500">
              Follow these steps to unlock your AI-powered hosting potential
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                    <span className="text-sm font-medium text-slate-600">1</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">Add Your First Property</h4>
                  <p className="text-sm text-gray-500">Set up your property details and AI host personality</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                    <span className="text-sm font-medium text-slate-600">2</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">Connect Your Platforms</h4>
                  <p className="text-sm text-gray-500">Link Airbnb, VRBO, or add manual bookings for real-time data</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                    <span className="text-sm font-medium text-slate-600">3</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">Create Guest Experiences</h4>
                  <p className="text-sm text-gray-500">Design AI-powered itineraries and memory packages</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            <p className="mt-1 text-sm text-gray-500">Powered by your real data</p>
          </div>
          <div className="px-6 py-5">
            {hasRealData ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">Data Connected</h4>
                      <p className="text-sm text-green-700">
                        Your platforms are synced. AI insights will appear as you collect more data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center py-4">
                  <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">More insights coming soon...</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
                <h4 className="mt-2 text-sm font-medium text-gray-900">No Data Yet</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Connect platforms or add properties to unlock AI insights
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/properties/new"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg">
        <div className="px-6 py-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-6 w-6 text-slate-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-slate-900">
                Get the most out of HostBuddies
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                Follow our setup guide to create amazing AI-powered experiences for your guests.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <Link
                href="/dashboard/properties/new"
                className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Setup First Property
              </Link>
              <Link
                href="/dashboard/guide"
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                View Guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

