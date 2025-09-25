import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMarketData } from '@/lib/ai-consultant-utils'
import { generateAIResponse, type AIMessage } from '@/lib/ai-providers'

export async function POST(request: NextRequest) {
  try {
    // Check if at least one AI service is configured
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      console.error('No AI services configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const { propertyId, currentPrice, analysisType = 'comprehensive' } = await request.json()

    if (!propertyId) {
      console.error('Missing propertyId for pricing analysis')
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get market data with error handling
    let marketData = {}
    try {
      marketData = await getMarketData((property as { location?: string }).location || 'San Francisco, CA')
    } catch (error) {
      console.warn('Failed to get market data for pricing:', error)
      marketData = { averagePrice: 150, occupancyRate: 0.75, error: 'Market data unavailable' }
    }

    // Create pricing session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: pricingSession, error: pricingSessionError } = await supabase
      .from('ai_consultant_sessions')
      .insert({
        id: `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        property_id: propertyId,
        session_type: 'pricing_analysis',
        status: 'active'
      })
      .select()
      .single()

    if (pricingSessionError || !pricingSession) {
      console.error('Failed to create pricing session:', pricingSessionError)
      return NextResponse.json({ error: 'Failed to create pricing session' }, { status: 500 })
    }

    // Perform pricing analysis
    const propertyData = property as { name?: string; location?: string; amenities?: object; property_type?: string }
    const pricingPrompt = `Analyze pricing strategy for this Airbnb property:\n\nPROPERTY DETAILS:\n- Name: ${propertyData.name}\n- Location: ${propertyData.location}\n- Current Price: $${currentPrice || 'Not set'}\n- Amenities: ${JSON.stringify(propertyData.amenities || {})}\n- Property Type: ${propertyData.property_type || 'Not specified'}\n\nMARKET DATA:\n${JSON.stringify(marketData)}\n\nANALYSIS REQUIREMENTS:\n1. Current Price Assessment: Is the price competitive?\n2. Market Positioning: Where does this property sit in the market?\n3. Seasonal Pricing: Recommend seasonal adjustments\n4. Dynamic Pricing: Suggest price ranges for different times\n5. Competitor Analysis: How do similar properties price?\n6. Revenue Optimization: Maximize revenue while maintaining occupancy\n7. Event-Based Pricing: Adjust for local events and holidays\n\nProvide specific pricing recommendations with expected revenue impact.`

    console.log('Making AI request for pricing analysis')
    
    // Prepare messages for AI providers
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are an expert Airbnb pricing strategist with deep knowledge of dynamic pricing, market analysis, and revenue optimization. Provide data-driven pricing recommendations.'
      },
      { role: 'user', content: pricingPrompt }
    ]
    
    // Use the new AI provider system with automatic fallback
    const aiResponse = await generateAIResponse(messages, {
      maxTokens: 1500,
      temperature: 0.2,
      model: 'gpt-4o'
    })
    
    const pricingAnalysis = aiResponse.content
    console.log(`✅ Pricing response from ${aiResponse.provider} (${aiResponse.model})`)

    // Compute pricing suggestions based on market data (deterministic baseline)
    const average = (marketData as { averagePrice?: number }).averagePrice || 150
    const pricingRecommendations = {
      basePrice: Math.round(average * 1.1),
      seasonalAdjustments: {
        spring: { multiplier: 1.1, reason: 'High demand season' },
        summer: { multiplier: 1.3, reason: 'Peak tourist season' },
        fall: { multiplier: 0.9, reason: 'Moderate demand' },
        winter: { multiplier: 0.8, reason: 'Low season' }
      },
      dynamicRanges: {
        weekday: { min: Math.round(average * 0.9), max: Math.round(average * 1.2) },
        weekend: { min: Math.round(average * 1.1), max: Math.round(average * 1.4) },
        holiday: { min: Math.round(average * 1.3), max: Math.round(average * 1.8) }
      },
      expectedRevenueIncrease: '15-25%'
    }

    // Store pricing analysis in memory with error handling
    try {
      await supabase
        .from('ai_consultant_memory')
        .insert({
          id: `pricing_memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          session_id: pricingSession.id,
          memory_type: 'pricing_data',
          content: {
            analysis_type: analysisType,
            current_price: currentPrice,
            analysis: pricingAnalysis,
            recommendations: pricingRecommendations,
            timestamp: new Date().toISOString()
          },
          importance_score: 8
        })
    } catch (memoryError) {
      console.warn('Failed to store pricing analysis in memory:', memoryError)
    }

    return NextResponse.json({
      analysis: pricingAnalysis,
      recommendations: pricingRecommendations,
      sessionId: pricingSession.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in pricing analysis:', error)
    return NextResponse.json({ 
      error: 'Pricing analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}




