'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ScavengerHuntBuilder from '@/components/dashboard/ScavengerHuntBuilder'
import { createClient } from '@/lib/supabase-client'

export default function NewItineraryPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('properties')
        .select('id, name, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name')

      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = (huntId: string) => {
    router.push(`/dashboard/hunts/${huntId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Create a Property First</h1>
          <p className="text-gray-600 mb-6">
            You need to have at least one active property before creating a scavenger hunt.
          </p>
          <button
            onClick={() => router.push('/dashboard/properties/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
          >
            Create Property
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Guest Itinerary</h1>
        <p className="mt-2 text-gray-600">
          Design personalized exploration guides and activity suggestions for your guests.
        </p>
      </div>
      
      <ScavengerHuntBuilder properties={properties} onComplete={handleComplete} />
    </div>
  )
}
