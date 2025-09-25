'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle, Wifi, MapPin, Clock, Trash2 } from 'lucide-react'

export default function PropertyAccessPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.propertyId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [property, setProperty] = useState<any>(null)

  useEffect(() => {
    const initializeGuestAccess = async () => {
      try {
        console.log('Initializing guest access for property:', propertyId)
        
        // Fetch property details first
        const propertyResponse = await fetch(`/api/properties/${propertyId}`)
        if (!propertyResponse.ok) {
          throw new Error('Property not found')
        }
        
        const propertyData = await propertyResponse.json()
        setProperty(propertyData)
        
        // Create a guest session for this property
        const sessionResponse = await fetch('/api/guest-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ propertyId }),
        })

        if (!sessionResponse.ok) {
          throw new Error('Failed to create guest session')
        }

        const { sessionId } = await sessionResponse.json()
        console.log('Guest session created:', sessionId)
        
        // Redirect to the guest chat with the new session
        router.push(`/guest/${sessionId}`)
        
      } catch (error) {
        console.error('Error initializing guest access:', error)
        setError(error instanceof Error ? error.message : 'Failed to access property')
        setLoading(false)
      }
    }

    if (propertyId) {
      initializeGuestAccess()
    }
  }, [propertyId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600">
            {property ? `Connecting you to ${property.name}...` : 'Setting up your experience...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact your host for assistance or try scanning the QR code again.
          </p>
        </div>
      </div>
    )
  }

  return null
}
