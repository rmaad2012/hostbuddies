'use client'

import { useState, useRef } from 'react'
import { Upload, Link, FileText, MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface EnhancedAIConsultantProps {
  propertyId: string
  sessionId?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface UploadedDocument {
  id: string
  name: string
  type: 'pdf' | 'text'
  status: 'processing' | 'completed' | 'failed'
}

interface ScrapedListing {
  id: string
  url: string
  title: string
  status: 'processing' | 'completed' | 'failed'
}

export default function EnhancedAIConsultant({ propertyId, sessionId: initialSessionId }: EnhancedAIConsultantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(initialSessionId)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [scrapedListings, setScrapedListings] = useState<ScrapedListing[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [showUrlScraper, setShowUrlScraper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Send message to AI consultant
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          propertyId,
          sessionId,
          sessionType: 'general_consultation'
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Set session ID if this is the first message
      if (!sessionId) {
        setSessionId(data.sessionId)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!sessionId) {
      alert('Please start a conversation first before uploading documents.')
      return
    }

    const newDoc: UploadedDocument = {
      id: `temp_${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : 'text',
      status: 'processing'
    }

    setUploadedDocs(prev => [...prev, newDoc])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', sessionId)

      const response = await fetch('/api/ai-consultant/upload-document', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Update document status
      setUploadedDocs(prev => 
        prev.map(doc => 
          doc.id === newDoc.id 
            ? { ...doc, id: data.documentId, status: 'completed' }
            : doc
        )
      )

      // Add system message about successful upload
      const systemMessage: Message = {
        role: 'assistant',
        content: `📄 Document "${file.name}" has been processed and added to my knowledge base. I can now reference this information in our conversation.`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, systemMessage])

    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadedDocs(prev => 
        prev.map(doc => 
          doc.id === newDoc.id 
            ? { ...doc, status: 'failed' }
            : doc
        )
      )
    }
  }

  // Handle URL scraping
  const handleUrlScraping = async (url: string) => {
    if (!sessionId) {
      alert('Please start a conversation first before scraping listings.')
      return
    }

    const newListing: ScrapedListing = {
      id: `temp_${Date.now()}`,
      url,
      title: 'Processing...',
      status: 'processing'
    }

    setScrapedListings(prev => [...prev, newListing])

    try {
      const response = await fetch('/api/ai-consultant/scrape-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, sessionId })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Update listing status
      setScrapedListings(prev => 
        prev.map(listing => 
          listing.id === newListing.id 
            ? { ...listing, id: data.scrapedId, status: 'completed', title: 'Airbnb Listing' }
            : listing
        )
      )

      // Add system message about successful scraping
      const systemMessage: Message = {
        role: 'assistant',
        content: `🔗 I've analyzed the Airbnb listing from ${url}. ${data.cached ? 'Using recent cached data.' : 'Fresh analysis completed.'} I can now compare your listing against this competitor.`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, systemMessage])

    } catch (error) {
      console.error('Error scraping listing:', error)
      setScrapedListings(prev => 
        prev.map(listing => 
          listing.id === newListing.id 
            ? { ...listing, status: 'failed', title: 'Failed to scrape' }
            : listing
        )
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">🤖 Enhanced AI Consultant</h2>
        <p className="opacity-90">Upload documents, scrape competitor listings, and get personalized advice</p>
        
        {/* Knowledge Base Status */}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <span>{uploadedDocs.filter(d => d.status === 'completed').length} Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <Link size={16} />
            <span>{scrapedListings.filter(l => l.status === 'completed').length} Scraped Listings</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b bg-gray-50 flex gap-2">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Upload size={16} />
          Upload Document
        </button>
        
        <button
          onClick={() => setShowUrlScraper(!showUrlScraper)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Link size={16} />
          Scrape Airbnb URL
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 border-b bg-blue-50">
          <h3 className="font-semibold mb-2">Upload Knowledge Base Document</h3>
          <p className="text-sm text-gray-600 mb-3">
            Upload PDFs or text files with Airbnb strategies, market reports, or optimization guides
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}

      {/* URL Scraper Section */}
      {showUrlScraper && (
        <div className="p-4 border-b bg-green-50">
          <h3 className="font-semibold mb-2">Scrape Competitor Airbnb Listing</h3>
          <p className="text-sm text-gray-600 mb-3">
            Enter an Airbnb listing URL to analyze competitor pricing, amenities, and descriptions
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://airbnb.com/rooms/..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const url = (e.target as HTMLInputElement).value
                  if (url) {
                    handleUrlScraping(url)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="url"]') as HTMLInputElement
                const url = input?.value
                if (url) {
                  handleUrlScraping(url)
                  input.value = ''
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Scrape
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Documents and Scraped Listings */}
      {(uploadedDocs.length > 0 || scrapedListings.length > 0) && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Documents */}
            {uploadedDocs.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">📄 Knowledge Base Documents</h4>
                <div className="space-y-2">
                  {uploadedDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      {doc.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                      {doc.status === 'processing' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
                      {doc.status === 'failed' && <AlertCircle size={16} className="text-red-500" />}
                      <span className="truncate">{doc.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scraped Listings */}
            {scrapedListings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">🔗 Analyzed Listings</h4>
                <div className="space-y-2">
                  {scrapedListings.map(listing => (
                    <div key={listing.id} className="flex items-center gap-2 text-sm">
                      {listing.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                      {listing.status === 'processing' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
                      {listing.status === 'failed' && <AlertCircle size={16} className="text-red-500" />}
                      <span className="truncate">{listing.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Welcome to Enhanced AI Consultant!</p>
            <p className="text-sm mt-2">
              Start by asking a question, uploading a document, or scraping a competitor listing.
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>💡 Try: "Audit my listing" or "How can I improve my pricing?"</p>
              <p>📄 Upload: Market reports, optimization guides, strategy documents</p>
              <p>🔗 Scrape: Competitor Airbnb listings for analysis</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your listing, upload documents, or paste Airbnb URLs..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
