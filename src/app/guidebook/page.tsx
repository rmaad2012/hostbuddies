'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Download, FileText, ArrowLeft } from 'lucide-react'

interface Property {
  id: string
  name: string
  guidebook_content?: string
  guidebook_url?: string
  check_in_instructions?: string
  wifi_name?: string
  wifi_password?: string
  trash_day?: string
  quiet_hours?: string
}

export default function GuidebookPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property')
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) {
      setError('No property ID provided')
      setLoading(false)
      return
    }

    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`)
      
      if (!response.ok) {
        throw new Error('Property not found')
      }
      
      const data = await response.json()
      setProperty(data.property)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guidebook...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Guidebook Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{property.name} Guidebook</h1>
                <p className="text-gray-600">Your complete property guide</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {property.guidebook_url && (
                <a
                  href={property.guidebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  Download PDF
                </a>
              )}
              
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Quick Info Cards */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Information</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {property.wifi_name && (
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">WiFi Network</h3>
                  <p className="text-sm text-gray-600">{property.wifi_name}</p>
                  {property.wifi_password && (
                    <p className="text-xs text-gray-500 mt-1">Password: {property.wifi_password}</p>
                  )}
                </div>
              )}

              {property.trash_day && (
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Trash Day</h3>
                  <p className="text-sm text-gray-600">{property.trash_day}</p>
                </div>
              )}

              {property.quiet_hours && (
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Quiet Hours</h3>
                  <p className="text-sm text-gray-600">{property.quiet_hours}</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-1">Emergency</h3>
                <p className="text-sm text-gray-600">911</p>
                <p className="text-xs text-gray-500 mt-1">For all emergencies</p>
              </div>
            </div>
          </div>

          {/* Check-in Instructions */}
          {property.check_in_instructions && (
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Check-in Instructions
              </h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {property.check_in_instructions}
                </div>
              </div>
            </div>
          )}

          {/* Main Guidebook Content */}
          {property.guidebook_content && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                Property Guidebook
              </h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {property.guidebook_content}
                </div>
              </div>
            </div>
          )}

          {/* No Content Message */}
          {!property.guidebook_content && !property.check_in_instructions && (
            <div className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Guidebook Content</h3>
              <p className="text-gray-600 mb-4">
                This property doesn't have guidebook content yet.
              </p>
              {property.guidebook_url && (
                <a
                  href={property.guidebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download size={16} />
                  Download PDF Guidebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
