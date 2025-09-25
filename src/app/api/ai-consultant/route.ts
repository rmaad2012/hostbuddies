import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMarketData, searchWeb, getListingHistory } from '@/lib/ai-consultant-utils'
import { getEnhancedMemory, buildEnhancedContext, storeEnhancedMemory } from '@/lib/enhanced-ai-consultant-utils'
import { generateAIResponse, type AIMessage } from '@/lib/ai-providers'
import { createMarketResearchPrompt, createPropertyOptimizationPrompt } from '@/lib/ai-consultant-prompts'

export async function POST(request: NextRequest) {
  try {
    // Check if at least one AI service is configured
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      console.error('No AI services configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const { 
      message, 
      propertyId, // Now optional - for market research mode
      sessionType = 'market_research',
      sessionId 
    } = await request.json()

    if (!message) {
      console.error('Missing required message parameter')
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Determine consultation mode
    const isMarketResearch = !propertyId
    const consultationMode = 'general_consultation' // Use allowed session type for both modes
    
    console.log(`AI consultant mode: ${consultationMode}${propertyId ? ` for property ${propertyId}` : ' (general market research)'}`)

    const supabase = await createServerSupabaseClient()
    
    // Get or create AI consultant session
    let consultantSession
    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('ai_consultant_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      consultantSession = existingSession
    }

    if (!consultantSession) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: newSession, error: sessionError } = await supabase
        .from('ai_consultant_sessions')
        .insert({
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          property_id: propertyId || null, // Allow null for market research
          session_type: consultationMode,
          status: 'active'
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating consultant session:', sessionError)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
      }
      consultantSession = newSession
    }

    // Get property details (only for property-specific mode)
    let property = null
    if (!isMarketResearch && propertyId) {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      property = propertyData
      if (propertyError || !property) {
        console.warn('Property not found, using default data:', propertyError)
        property = {
          id: propertyId,
          name: 'Your Property',
          location: 'San Francisco, CA',
          title: 'Not set',
          description: 'Not set',
          amenities: {},
          pricing_data: {}
        }
      }
    }

    // Get enhanced AI consultant memory for this session
    const enhancedMemory = await getEnhancedMemory(consultantSession.id, supabase)

    // Get property-specific knowledge base (only for property mode)
    let knowledgeBase = []
    if (!isMarketResearch && propertyId) {
      try {
        const { data: kbData } = await supabase
          .from('kb_docs')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
        knowledgeBase = kbData || []
      } catch (error) {
        console.warn('Error fetching knowledge base (table may not exist):', error)
      }
    }

    // Get listing history (only for property mode)
    let listingHistory = []
    if (!isMarketResearch && propertyId) {
      try {
        listingHistory = await getListingHistory(propertyId, supabase)
      } catch (error) {
        console.warn('Failed to get listing history:', error)
      }
    }

    // Get market data (for both modes, but use general location for market research)
    let marketData = {}
    try {
      const location = property?.location || 'Global Market' // General market for research mode
      marketData = await getMarketData(location)
    } catch (error) {
      console.warn('Failed to get market data:', error)
      marketData = { averagePrice: 150, occupancyRate: 0.75, error: 'Market data unavailable' }
    }

    // Detect and automatically process Airbnb URLs
    let urlProcessingResults = null
    let webSearchResults = null
    const airbnbUrlMatch = message.match(/https?:\/\/(?:www\.)?airbnb\.com\/[^\s]+/i)
    
    if (airbnbUrlMatch) {
      const airbnbUrl = airbnbUrlMatch[0]
      console.log('🔗 Airbnb URL detected, initiating analysis:', airbnbUrl)
      
      try {
        // Trigger URL scraping for analysis
        const { scrapeAirbnbListing } = await import('@/lib/enhanced-ai-consultant-utils')
        const scrapedId = await scrapeAirbnbListing(airbnbUrl, consultantSession.id, (await supabase.auth.getUser()).data.user?.id || '', supabase)
        urlProcessingResults = {
          type: 'airbnb_listing_analysis',
          url: airbnbUrl,
          scrapedId,
          message: `✅ Successfully analyzed the Airbnb listing! I can now provide detailed competitive insights and optimization recommendations.`
        }
        console.log('✅ Airbnb URL processed successfully')
      } catch (error) {
        console.warn('⚠️ Airbnb URL processing failed:', error)
        urlProcessingResults = {
          type: 'airbnb_listing_analysis',
          url: airbnbUrl,
          error: true,
          message: `🔗 I detected an Airbnb URL! While I couldn't scrape it automatically, I can still provide competitive analysis and optimization suggestions based on the URL structure and best practices.`
        }
      }
    }
    
    // Perform web search for current events if relevant
    if (message.toLowerCase().includes('current') || 
        message.toLowerCase().includes('news') || 
        message.toLowerCase().includes('events') ||
        message.toLowerCase().includes('trending')) {
      try {
        webSearchResults = await searchWeb(message)
      } catch (error) {
        console.warn('Web search failed:', error)
      }
    }

    // Build enhanced context for AI using new system
    const enhancedContext = buildEnhancedContext(enhancedMemory, property)

    // Build property knowledge base context
    let knowledgeBaseContext = ''
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeBaseContext = `\nPROPERTY KNOWLEDGE BASE:\n`
      knowledgeBase.forEach((kb: any) => {
        knowledgeBaseContext += `Q: ${kb.question}\nA: ${kb.answer}\n\n`
      })
    }

    // Create dynamic system prompt based on consultation mode
    const systemPrompt = isMarketResearch 
      ? createMarketResearchPrompt(enhancedContext, webSearchResults, urlProcessingResults, marketData)
      : createPropertyOptimizationPrompt(property, enhancedContext, knowledgeBaseContext, listingHistory, marketData, webSearchResults, urlProcessingResults)

    console.log('Making AI request for consultant')
    
    // Prepare messages for AI providers
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]
    
    // Use the new AI provider system with automatic fallback
    const aiResponse = await generateAIResponse(messages, {
      maxTokens: 2000,
      temperature: 0.3,
      model: 'gpt-4o'
    })
    
    console.log(`✅ AI consultant response from ${aiResponse.provider} (${aiResponse.model})`)

    // Store enhanced memory for future conversations
    try {
      await storeEnhancedMemory(
        consultantSession.id, 
        'conversation_history',
        {
          user_query: message,
          ai_response: aiResponse.content,
          context_used: {
            consultation_mode: isMarketResearch ? 'market_research' : 'property_optimization',
            property_id: propertyId,
            has_url_analysis: !!urlProcessingResults,
            has_web_search: !!webSearchResults
          }
        },
        7, // importance score
        supabase
      )
    } catch (error) {
      console.warn('Failed to store enhanced memory:', error)
    }

    return NextResponse.json({ 
      response: aiResponse.content,
      sessionId: consultantSession.id,
      consultationMode: isMarketResearch ? 'market_research' : 'property_optimization',
      urlProcessingResults,
      provider: aiResponse.provider,
      model: aiResponse.model
    })

  } catch (error) {
    console.error('Error in AI consultant API:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json({
      error: 'Something went wrong processing your request. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
