'use client'

import { useState } from 'react'

interface ScrapedContent {
  title?: string
  description?: string
  rating?: number
  reviewsCount?: number
  amenities?: string[]
  houseRules?: string
  location?: string
  photoAlts?: string[]
  url: string
  scrapedAt: string
  method: 'opengraph' | 'jsonld' | 'playwright'
  success: boolean
  error?: string
}

export default function TestScraper() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<ScrapedContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScrape = async () => {
    if (!url) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Scraping failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 URL Scraping API Test
          </h1>
          
          <div className="mb-6">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Enter URL to scrape:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleScrape}
                disabled={loading || !url}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">❌ Error: {error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h2 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ Scraping Results
                </h2>
                <div className="text-sm text-green-700">
                  <p><strong>Method:</strong> {result.method}</p>
                  <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
                  <p><strong>Scraped at:</strong> {new Date(result.scrapedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">📄 Basic Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Title:</span>
                        <p className="text-gray-700">{result.title || 'Not found'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-gray-700">{result.description || 'Not found'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="text-gray-700">{result.location || 'Not found'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">⭐ Ratings & Reviews</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Rating:</span>
                        <span className="text-gray-700 ml-2">
                          {result.rating ? `${result.rating}/5` : 'Not found'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Reviews Count:</span>
                        <span className="text-gray-700 ml-2">
                          {result.reviewsCount || 'Not found'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">🏠 Amenities</h3>
                    <div className="text-sm">
                      {result.amenities && result.amenities.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {result.amenities.map((amenity, index) => (
                            <li key={index}>{amenity}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No amenities found</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">📸 Photos</h3>
                    <div className="text-sm">
                      {result.photoAlts && result.photoAlts.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-gray-700">
                            Found {result.photoAlts.length} images
                          </p>
                          <div className="max-h-32 overflow-y-auto">
                            {result.photoAlts.slice(0, 5).map((alt, index) => (
                              <p key={index} className="text-xs text-gray-600 truncate">
                                {alt}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No photos found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {result.error && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">⚠️ Warning: {result.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🔧 API Features</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>OpenGraph/JSON-LD</strong> extraction (fast, low risk)</li>
              <li>• <strong>Playwright rendering</strong> for complex sites (fallback)</li>
              <li>• <strong>Public content only</strong> (no login/bypass tricks)</li>
              <li>• <strong>Respects robots.txt</strong> and rate limits</li>
              <li>• <strong>Ethical scraping</strong> with proper user agents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
