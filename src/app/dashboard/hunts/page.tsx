import Link from 'next/link'
import { Plus, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function ScavengerHuntsPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get user's scavenger hunts
  let hunts: any[] = []
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('scavenger_hunts')
        .select(`
          *,
          properties (name),
          hunt_clues (id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      hunts = data || []
    }
  } catch (error) {
    console.error('Error fetching hunts:', error)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold text-gray-900">Itinerary Planner</h1>
        <p className="mt-2 text-gray-600">
          Create personalized itineraries and exploration guides for your guests.
        </p>
        </div>
        <Link
          href="/dashboard/hunts/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Itinerary
        </Link>
      </div>

      {hunts.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No itineraries yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first guest itinerary.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/hunts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Itinerary
            </Link>
          </div>
        </div>
      ) : (
        /* Hunts List */
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Scavenger Hunts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {hunts.map((hunt) => (
              <div key={hunt.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{hunt.name}</h4>
                        <p className="text-sm text-gray-600">
                          Property: {hunt.properties?.name || 'Unknown'}
                        </p>
                        {hunt.description && (
                          <p className="text-sm text-gray-500 mt-1">{hunt.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{hunt.hunt_clues?.length || 0} clues</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(hunt.status)}`}>
                        {hunt.status}
                      </span>
                      <span>Created {new Date(hunt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/hunts/${hunt.id}/preview`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/hunts/${hunt.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
