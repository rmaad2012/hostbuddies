'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, Target, Lightbulb, BarChart3, MessageSquare, Sparkles } from 'lucide-react'

interface AIConsultantProps {
  propertyId?: string // Optional for market research mode
  propertyName?: string // Optional for market research mode
}

export default function AIConsultant({ propertyId, propertyName }: AIConsultantProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'audit' | 'pricing' | 'recommendations'>('chat')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string, timestamp: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [auditResults, setAuditResults] = useState<string | null>(null)
  const [optimizationScore, setOptimizationScore] = useState<number | null>(null)
  const [pricingResult, setPricingResult] = useState<{ analysis?: string; recommendations?: object; error?: string } | null>(null)
  const [isMarketResearch, setIsMarketResearch] = useState(!propertyId) // Default to market research if no property

  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'audit', label: 'Listing Audit', icon: Target },
    { id: 'pricing', label: 'Pricing', icon: TrendingUp },
    { id: 'recommendations', label: 'Insights', icon: Lightbulb }
  ] as const

  const sendMessage = async (message: string) => {
    if (!message.trim()) return
    const userMessage = { role: 'user' as const, content: message, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    try {
      const requestBody: any = { 
        message, 
        sessionId 
      }
      
      // Only include propertyId for property-specific mode
      if (!isMarketResearch && propertyId) {
        requestBody.propertyId = propertyId
      }

      const response = await fetch('/api/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('AI Consultant API Response:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (!data.response) {
        throw new Error('No response received from AI')
      }
      
      if (data.sessionId) setSessionId(data.sessionId)
      const aiMessage = { role: 'ai' as const, content: data.response, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, aiMessage])
    } catch (e) {
      console.error('Error in AI chat:', e)
      let errorMessage = 'Something went wrong. Please try again.'
      if (e instanceof Error) {
        if (e.message.includes('AI service not configured')) {
          errorMessage = 'AI service is not properly configured. Please contact support.'
        } else if (e.message.includes('Unauthorized')) {
          errorMessage = 'Authentication required. Please refresh the page and try again.'
        } else if (e.message.includes('Property not found')) {
          errorMessage = 'Property not found. Please refresh and try again.'
        } else if (e.message.includes('HTTP 500')) {
          errorMessage = 'Server error occurred. Please try again in a moment.'
        } else if (e.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        }
      }
      const aiMessage = { role: 'ai' as const, content: errorMessage, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const runListingAudit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-consultant/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setAuditResults(data.auditResults)
      setOptimizationScore(data.optimizationScore)
      if (data.sessionId) setSessionId(data.sessionId)
      setActiveTab('recommendations')
    } catch (error) {
      console.error('Error running audit:', error)
      setAuditResults('Failed to run audit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const runPricingAnalysis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-consultant/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setPricingResult(data)
      if (data.sessionId) setSessionId(data.sessionId)
      setActiveTab('recommendations')
    } catch (error) {
      console.error('Error running pricing analysis:', error)
      setPricingResult({ error: 'Failed to run pricing analysis. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">AI Consultant</h2>
            <p className="text-purple-100">
              {isMarketResearch 
                ? 'Market research and competitive analysis for any Airbnb listing'
                : `Optimize your ${propertyName} listing with AI`
              }
            </p>
          </div>
          
          {/* Mode Toggle */}
          <div className="bg-white/10 rounded-lg p-1 flex">
            <button
              onClick={() => setIsMarketResearch(false)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                !isMarketResearch 
                  ? 'bg-white text-purple-700' 
                  : 'text-purple-100 hover:text-white'
              }`}
              disabled={!propertyId}
            >
              My Property
            </button>
            <button
              onClick={() => setIsMarketResearch(true)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isMarketResearch 
                  ? 'bg-white text-purple-700' 
                  : 'text-purple-100 hover:text-white'
              }`}
            >
              Market Research
            </button>
          </div>
        </div>
        {typeof optimizationScore === 'number' && (
          <div className="mt-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span className="text-lg font-semibold">Optimization Score: {optimizationScore}/100</span>
            <div className="flex-1 bg-purple-200 rounded-full h-2 ml-4">
              <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${optimizationScore}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="h-[600px] overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                    <p>Start a conversation with your AI consultant!</p>
                    <p className="text-sm">Ask about pricing, optimization, or any listing questions.</p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                  placeholder={isMarketResearch 
                    ? "Paste any Airbnb URL for competitive analysis..." 
                    : "Ask your AI consultant anything..."
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button onClick={() => sendMessage(inputMessage)} disabled={isLoading || !inputMessage.trim()} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Send
                </button>
              </div>
              
              {/* Market Research Examples */}
              {isMarketResearch && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">💡 Try these market research examples:</h4>
                  <div className="space-y-2">
                    {[
                      'Analyze this successful listing: https://www.airbnb.com/rooms/12345',
                      'What makes this listing perform so well?',
                      'What mistakes is this poorly-rated listing making?',
                      'Compare these two listings and tell me which strategy is better',
                      'What trends do you see in luxury beachfront properties?'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(example)}
                        className="block w-full text-left p-2 text-sm text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Listing Audit</h3>
                <p className="text-gray-600 mb-6">Get a comprehensive analysis of your listing with AI-powered insights</p>
                <button onClick={runListingAudit} disabled={isLoading} className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Run Audit
                    </>
                  )}
                </button>
              </div>

              {auditResults && (
                <div className="prose max-w-none whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {auditResults}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Pricing Analysis</h3>
                <p className="text-gray-600 mb-6">Data-driven price recommendations based on market trends</p>
                <button onClick={runPricingAnalysis} disabled={isLoading} className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <TrendingUp className="h-5 w-5" />
                      Analyze Pricing
                    </>
                  )}
                </button>
              </div>

              {pricingResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">AI Analysis</h4>
                    <div className="text-sm whitespace-pre-wrap">{pricingResult.analysis}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <div className="text-sm">
                      <div>Base Price: ${'{'}pricingResult.recommendations.basePrice{'}'}</div>
                      <div className="mt-2">
                        <div className="font-medium">Dynamic Ranges</div>
                        <ul className="list-disc pl-5">
                          <li>Weekday: ${'{'}pricingResult.recommendations.dynamicRanges.weekday.min{'}'} - ${'{'}pricingResult.recommendations.dynamicRanges.weekday.max{'}'}</li>
                          <li>Weekend: ${'{'}pricingResult.recommendations.dynamicRanges.weekend.min{'}'} - ${'{'}pricingResult.recommendations.dynamicRanges.weekend.max{'}'}</li>
                          <li>Holiday: ${'{'}pricingResult.recommendations.dynamicRanges.holiday.min{'}'} - ${'{'}pricingResult.recommendations.dynamicRanges.holiday.max{'}'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div key="recs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {!auditResults && !pricingResult && (
                <div className="text-center text-gray-500 py-8">Run an audit or pricing analysis to see insights.</div>
              )}
              {auditResults && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Audit Highlights</h4>
                  <div className="text-sm whitespace-pre-wrap">{auditResults}</div>
                </div>
              )}
              {pricingResult && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Pricing Highlights</h4>
                  <div className="text-sm">Base Price Suggestion: ${'{'}pricingResult.recommendations.basePrice{'}'}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
