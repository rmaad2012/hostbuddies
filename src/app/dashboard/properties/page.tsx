'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Building, QrCode, Edit, Settings, Eye, CheckCircle, X, MessageCircle } from 'lucide-react'
import { getPropertiesClient } from '@/lib/supabase-client'
import QRCodeGenerator from '@/components/dashboard/QRCodeGenerator'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [testingChat, setTestingChat] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getPropertiesClient()
        setProperties(data)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()

    // Check if we just created a property
    const createdPropertyId = searchParams.get('created')
    if (createdPropertyId) {
      setShowSuccess(true)
      // Remove the parameter from URL without refreshing
      const url = new URL(window.location.href)
      url.searchParams.delete('created')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleTestChat = (propertyId: string) => {
    setTestingChat(propertyId)
    
    // Open the property access page which will create a guest session automatically
    window.open(`/property/${propertyId}`, '_blank')
    
    // Reset the loading state after a short delay
    setTimeout(() => setTestingChat(null), 1000)
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

  const getPersonaEmoji = (persona: string) => {
    switch (persona) {
      case 'friendly_guide':
        return '😊'
      case 'foodie_pal':
        return '🍽️'
      case 'trail_ranger':
        return '🏔️'
      default:
        return '🤖'
    }
  }

  const getPersonaName = (persona: string) => {
    switch (persona) {
      case 'friendly_guide':
        return 'Friendly Guide'
      case 'foodie_pal':
        return 'Foodie Pal'
      case 'trail_ranger':
        return 'Trail Ranger'
      default:
        return 'AI Host'
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Property Created Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                Your AI host is now ready to help guests. Click the chat icon (💬) to test your AI or customize it further.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-green-400 hover:text-green-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900">Properties</h1>
          <p className="mt-3 text-lg text-charcoal-600">
            Manage your properties and their AI host configurations.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Link>
      </div>

      {loading ? (
        /* Loading State */
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first property with an AI host.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </Link>
          </div>
        </div>
      ) : (
        /* Properties Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Property Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                        {property.status}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <span className="mr-1">{getPersonaEmoji(property.persona_style)}</span>
                        {getPersonaName(property.persona_style)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestChat(property.id)}
                      disabled={testingChat === property.id}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                      title="Test AI Chat"
                    >
                      {testingChat === property.id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      href={`/guest/${property.id}`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Preview Guest Experience"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/properties/${property.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Customize AI & Guidebook"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/properties/${property.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit Property"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {property.wifi_name && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-20">WiFi:</span>
                      <span className="text-gray-900 font-mono">{property.wifi_name}</span>
                    </div>
                  )}
                  {property.trash_day && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-20">Trash:</span>
                      <span className="text-gray-900">{property.trash_day}</span>
                    </div>
                  )}
                  {property.quiet_hours && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-20">Quiet:</span>
                      <span className="text-gray-900">{property.quiet_hours}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Created:</span>
                    <span className="text-gray-900">{new Date(property.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <QRCodeGenerator 
                  propertyId={property.id} 
                  propertyName={property.name}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-semibold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold text-sm">
                  {properties.filter(p => p.status === 'active').length}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Properties</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {properties.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <QrCode className="w-8 h-8 text-slate-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">QR Codes Ready</p>
                <p className="text-2xl font-semibold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
