'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { 
  Send, 
  MessageCircle, 
  Wifi,
  MapPin,
  Clock,
  Coffee,
  Car,
  HelpCircle,
  Star,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Home,
  Utensils,
  Camera,
  Sun
} from 'lucide-react'
import Image from 'next/image'

interface ChatMessage {
  id: string
  type: 'guest' | 'assistant'
  content: string
  timestamp: Date
}

interface PropertyInfo {
  id: string
  name: string
  location?: string
  wifi_name?: string
  wifi_password?: string
  check_in_instructions?: string
  checkin_video_url?: string
  trash_day?: string
  quiet_hours?: string
  host_name?: string
  host_contact?: string
}

interface QuickAction {
  icon: React.ElementType
  label: string
  question: string
  category: 'essentials' | 'local' | 'property'
}

const quickActions: QuickAction[] = [
  // Essentials
  { icon: Wifi, label: 'WiFi Password', question: 'What is the WiFi password?', category: 'essentials' },
  { icon: Car, label: 'Parking Info', question: 'Where can I park?', category: 'essentials' },
  { icon: Clock, label: 'Check-out Time', question: 'What time is checkout?', category: 'essentials' },
  { icon: HelpCircle, label: 'Cleaning Supplies', question: 'Where are the cleaning supplies located?', category: 'essentials' },
  
  // Property
  { icon: Home, label: 'House Rules', question: 'What are the house rules and quiet hours?', category: 'property' },
  { icon: Camera, label: 'Best Photo Spots', question: 'What are the best spots for photos around the property?', category: 'property' },
  
  // Local Area
  { icon: Coffee, label: 'Coffee Shops', question: 'What are the best coffee shops nearby?', category: 'local' },
  { icon: Utensils, label: 'Restaurants', question: 'Can you recommend good restaurants in the area?', category: 'local' },
  { icon: MapPin, label: 'Local Attractions', question: 'What are the top attractions and things to do nearby?', category: 'local' },
  { icon: Sun, label: 'Weather & Activities', question: 'What are some good activities based on today\'s weather?', category: 'local' }
]

export default function GuestAssistant() {
  const params = useParams()
  const sessionId = params.sessionId as string
  
  // State
  const [property, setProperty] = useState<PropertyInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [activeCategory, setActiveCategory] = useState<'essentials' | 'local' | 'property'>('essentials')
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize session and property data
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Fetch guest session to get property ID
        const sessionResponse = await fetch(`/api/guest-session?sessionId=${sessionId}`)
        const sessionData = await sessionResponse.json()
        
        if (sessionData.error) {
          console.error('Session error:', sessionData.error)
          setIsLoading(false)
          return
        }

        // Fetch property details
        const propertyResponse = await fetch(`/api/properties/${sessionData.property_id}`)
        const propertyData = await propertyResponse.json()
        
        if (!propertyData.error) {
          setProperty(propertyData)
          
          // Add welcome message
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            type: 'assistant',
            content: `Welcome to ${propertyData.name}! 🏠 I'm your personal assistant, here to help make your stay comfortable and memorable. I can help you with WiFi passwords, local recommendations, house information, and anything else you need. How can I assist you today?`,
            timestamp: new Date()
          }
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      initializeSession()
    }
  }, [sessionId])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Send message function
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !property) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'guest',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          propertyId: property.id,
          sessionId: sessionId
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp)
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment, or feel free to contact your host directly if it's urgent.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickAction = (question: string) => {
    sendMessage(question)
    setShowQuickActions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  const filteredQuickActions = quickActions.filter(action => action.category === activeCategory)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Assistant</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{property?.name || 'Guest Assistant'}</h1>
                <p className="text-sm text-gray-500">Your personal property assistant</p>
              </div>
            </div>
            {property?.host_contact && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Host Available</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">How can I help you today?</h3>
                <button
                  onClick={() => setShowQuickActions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'essentials', label: 'Essentials', icon: Wifi },
                  { key: 'property', label: 'Property', icon: Home },
                  { key: 'local', label: 'Local Area', icon: MapPin }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key as any)}
                    className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeCategory === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredQuickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.question)}
                    className="flex items-center p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <action.icon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show Quick Actions Button (when hidden) */}
          {!showQuickActions && (
            <div className="border-b border-gray-200 p-4">
              <button
                onClick={() => setShowQuickActions(true)}
                className="w-full flex items-center justify-center p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 mr-2" />
                Show Quick Actions
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="h-96 overflow-y-auto p-6 space-y-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'guest' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md flex items-start space-x-3 ${
                  message.type === 'guest' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'guest' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-600'
                  }`}>
                    {message.type === 'guest' ? (
                      <span className="text-white text-xs font-medium">You</span>
                    ) : (
                      <MessageCircle className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`rounded-lg px-4 py-2 ${
                    message.type === 'guest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'guest' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything about your stay..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              I can help with WiFi, directions, recommendations, house rules, and more!
            </p>
          </div>
        </div>

        {/* Property info cards */}
        {property && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WiFi Info */}
            {property.wifi_name && (
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Wifi className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">WiFi Network</h4>
                </div>
                <p className="text-sm text-gray-600">Network: {property.wifi_name}</p>
                {property.wifi_password && (
                  <p className="text-sm text-gray-600">Password: {property.wifi_password}</p>
                )}
              </div>
            )}

            {/* Emergency Contact */}
            {property.host_contact && (
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Host Contact</h4>
                </div>
                <p className="text-sm text-gray-600">{property.host_name || 'Your Host'}</p>
                <p className="text-sm text-blue-600">{property.host_contact}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}