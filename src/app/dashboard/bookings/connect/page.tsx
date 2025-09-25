'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Upload,
  Calendar,
  Settings,
  Key,
  Download
} from 'lucide-react'
import { 
  connectAirbnbListingClient, 
  getPropertiesClient,
  getConnectedListingsClient
} from '@/lib/supabase-client'

export default function ConnectAirbnbPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [connectedListings, setConnectedListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState('')
  const [listingId, setListingId] = useState('')
  const [listingTitle, setListingTitle] = useState('')
  const [listingUrl, setListingUrl] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<'manual' | 'csv' | 'api'>('manual')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const propertiesData = await getPropertiesClient()
      setProperties(propertiesData)
      
      // Load connected listings for all properties
      const allConnectedListings = []
      for (const property of propertiesData) {
        const listings = await getConnectedListingsClient(property.id)
        allConnectedListings.push(...listings)
      }
      setConnectedListings(allConnectedListings)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProperty || !listingId || !listingTitle) return

    setConnecting(true)
    const result = await connectAirbnbListingClient(selectedProperty, {
      external_listing_id: listingId,
      listing_title: listingTitle,
      listing_url: listingUrl || undefined
    })

    if (result) {
      setConnectedListings(prev => [...prev, result])
      setListingId('')
      setListingTitle('')
      setListingUrl('')
      setSelectedProperty('')
    }
    setConnecting(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/bookings"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connect Airbnb</h1>
          <p className="mt-2 text-gray-600">
            Link your Airbnb listings to manage bookings and create guest experiences
          </p>
        </div>
      </div>

      {/* Connection Methods */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Connection Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setConnectionMethod('manual')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              connectionMethod === 'manual'
                ? 'border-slate-500 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Settings className="w-6 h-6 text-slate-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manual Entry</h3>
            <p className="text-sm text-gray-600 mt-1">
              Enter your Airbnb listing details manually
            </p>
          </button>

          <button
            onClick={() => setConnectionMethod('csv')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              connectionMethod === 'csv'
                ? 'border-slate-500 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="w-6 h-6 text-slate-600 mb-2" />
            <h3 className="font-medium text-gray-900">CSV Import</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import multiple listings from a CSV file
            </p>
          </button>

          <button
            onClick={() => setConnectionMethod('api')}
            className={`p-4 border-2 rounded-lg text-left transition-colors relative ${
              connectionMethod === 'api'
                ? 'border-slate-500 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Key className="w-6 h-6 text-slate-600 mb-2" />
            <h3 className="font-medium text-gray-900">API Integration</h3>
            <p className="text-sm text-gray-600 mt-1">
              Direct API connection (requires approval)
            </p>
            <div className="absolute top-2 right-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          </button>
        </div>

        {/* Manual Entry Form */}
        {connectionMethod === 'manual' && (
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                <option value="">Choose a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Airbnb Listing ID
              </label>
              <input
                type="text"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                placeholder="e.g., 12345678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Find this in your Airbnb listing URL: airbnb.com/rooms/<strong>12345678</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Title
              </label>
              <input
                type="text"
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
                placeholder="e.g., Cozy Downtown Loft"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing URL (Optional)
              </label>
              <input
                type="url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://www.airbnb.com/rooms/12345678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={connecting || !selectedProperty || !listingId || !listingTitle}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting...' : 'Connect Listing'}
            </button>
          </form>
        )}

        {/* CSV Import */}
        {connectionMethod === 'csv' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">CSV Format Requirements</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your CSV should include columns: property_id, listing_id, listing_title, listing_url
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop your CSV file here, or click to browse
                  </span>
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button className="inline-flex items-center text-sm text-slate-600 hover:text-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </button>
              <button className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                Import Listings
              </button>
            </div>
          </div>
        )}

        {/* API Integration Info */}
        {connectionMethod === 'api' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-900">API Access Required</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Direct API integration with Airbnb requires approval as an official software partner. 
                    We're working on this feature and will notify you when it's available.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">What API Integration Will Provide:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Automatic booking synchronization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Real-time calendar updates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Guest information import
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Automated session creation
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
            >
              API Integration Coming Soon
            </button>
          </div>
        )}
      </div>

      {/* Connected Listings */}
      {connectedListings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Listings</h2>
          <div className="space-y-3">
            {connectedListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-red-600 font-bold">A</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{listing.listing_title}</h3>
                    <p className="text-sm text-gray-600">
                      ID: {listing.external_listing_id} • {listing.platform_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                  {listing.listing_url && (
                    <Link
                      href={listing.listing_url}
                      target="_blank"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Calendar className="w-6 h-6 text-slate-600 mr-3 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Import Your Bookings</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manually add your existing bookings or wait for automatic sync
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Settings className="w-6 h-6 text-slate-600 mr-3 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Customize Guest Experience</h3>
              <p className="text-sm text-gray-600 mt-1">
                Set up your AI host and create engaging scavenger hunts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
