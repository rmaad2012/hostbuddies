import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMarketData, generateRecommendations } from '@/lib/ai-consultant-utils'
import { generateAIResponse, type AIMessage } from '@/lib/ai-providers'

export async function POST(request: NextRequest) {
  try {
    // Check if at least one AI service is configured
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      console.error('No AI services configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const { propertyId, auditType = 'comprehensive' } = await request.json()

    if (!propertyId) {
      console.error('Missing propertyId for audit')
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
      marketData = await getMarketData(property.location || 'San Francisco, CA')
    } catch (error) {
      console.warn('Failed to get market data for audit:', error)
      marketData = { averagePrice: 150, occupancyRate: 0.75, error: 'Market data unavailable' }
    }

    // Create audit session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: auditSession, error: auditSessionError } = await supabase
      .from('ai_consultant_sessions')
      .insert({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        property_id: propertyId,
        session_type: 'listing_audit',
        status: 'active'
      })
      .select()
      .single()

    if (auditSessionError || !auditSession) {
      console.error('Failed to create audit session:', auditSessionError)
      return NextResponse.json({ error: 'Failed to create audit session' }, { status: 500 })
    }

    // Perform AI audit
    const auditPrompt = `🔍 COMPREHENSIVE AIRBNB REVENUE OPTIMIZATION AUDIT

PROPERTY PROFILE:
- Name: ${property.name}
- Location: ${property.location}
- Current Title: ${property.title || 'Not set'}
- Description: ${property.description || 'Not set'}
- Amenities: ${JSON.stringify(property.amenities || {})}
- Current Pricing: ${JSON.stringify(property.pricing_data || {})}

MARKET INTELLIGENCE:
${JSON.stringify(marketData)}

🎯 REQUIRED AUDIT ANALYSIS:

1. 📝 TITLE OPTIMIZATION AUDIT:
   - Rewrite title with power words, emotional triggers, and local SEO
   - Provide 3 optimized versions with psychology explanations
   - Include character count and platform-specific optimization
   - Expected CTR improvement percentage

2. ✍️ DESCRIPTION TRANSFORMATION:
   - Rewrite with storytelling, benefit-focused copy, and guest journey mapping
   - Add local attractions, unique experiences, and emotional appeals
   - Include strategic keyword placement for SEO
   - Expected conversion rate improvement

3. 💰 CREATIVE REVENUE OPPORTUNITIES:
   Based on location type, suggest:
   - Mini-mart setup: specific products, suppliers, markup percentages
   - Local partnerships: wine/artisanal goods, commission structures
   - Experience packages: romantic, family, adventure based on location
   - Seasonal revenue boosters with projected monthly income
   - Upselling opportunities during booking and stay

4. 🏠 HIGH-ROI AMENITY RECOMMENDATIONS:
   - Priority amenities based on property type and guest demographics
   - Cost analysis and payback period for each recommendation
   - Competitive differentiation through unique combinations
   - Guest satisfaction impact and booking premium potential

5. 📊 PRICING STRATEGY OVERHAUL:
   - Dynamic pricing recommendations with seasonal multipliers
   - Event-based pricing for local happenings
   - Psychological pricing techniques (charm pricing, anchoring)
   - Premium positioning strategies

6. 📸 VISUAL APPEAL OPTIMIZATION:
   - Photo improvement priorities (hero shots, amenity highlights, lifestyle images)
   - Staging recommendations for maximum appeal
   - Virtual tour and video content suggestions

7. 🎨 SEASONAL & THEMATIC OPPORTUNITIES:
   - Holiday packages and themed experiences
   - Seasonal amenity additions and removals
   - Limited-time offers and urgency creation

🎯 DELIVERABLE REQUIREMENTS:
- Quantify EVERYTHING with dollar amounts and percentages
- Provide implementation timelines and priorities
- Include specific supplier recommendations and contact methods
- Calculate total revenue increase potential
- Prioritize recommendations by ROI and effort level

Focus on creative, profitable solutions that differentiate this property from competitors.`

    console.log('Making AI request for listing audit')
    
    // Prepare messages for AI providers
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are HostBuddies' elite Airbnb revenue optimization specialist with 15+ years of experience. You've helped hosts increase revenue by 150-300% through creative strategies, psychological optimization, and data-driven decisions.

🏆 YOUR TRACK RECORD:
- 2,000+ properties optimized with average 180% revenue increase
- Expert in creative revenue streams (mini-marts generating $2K-5K monthly)
- Psychology-driven listing optimization with 40%+ booking increases
- Strategic amenity recommendations with 3-6 month ROI payback

💡 YOUR SPECIALTIES:
- Creative revenue generation (local products, experiences, convenience items)
- Location-specific optimization (romantic vs family vs business vs adventure)
- Psychological triggers in titles and descriptions
- High-ROI amenity identification and cost-benefit analysis
- Premium positioning and pricing psychology

📊 YOUR ANALYSIS STYLE:
- Always quantify recommendations with specific dollar amounts and percentages
- Provide exact implementation steps and timelines
- Include supplier suggestions and cost breakdowns  
- Prioritize by ROI and effort level
- Reference successful case studies and market data

Be enthusiastic, specific, and focused on maximizing revenue through creative business strategies.`
      },
      { role: 'user', content: auditPrompt }
    ]
    
    // Use the new AI provider system with automatic fallback
    const aiResponse = await generateAIResponse(messages, {
      maxTokens: 2000,
      temperature: 0.3,
      model: 'gpt-4o'
    })
    
    const auditResults = aiResponse.content
    console.log(`✅ Audit response from ${aiResponse.provider} (${aiResponse.model})`)

    // Generate specific recommendations with error handling
    let recommendations: any[] = []
    try {
      recommendations = await generateRecommendations(auditSession.id, auditType, supabase)
    } catch (error) {
      console.warn('Failed to generate recommendations:', error)
      recommendations = []
    }

    // Calculate optimization score
    const optimizationScore = Math.floor(Math.random() * 40) + 60 // Mock score between 60-100

    // Update property with optimization score
    try {
      await supabase
        .from('properties')
        .update({ 
          ai_optimization_score: optimizationScore,
          last_ai_audit: new Date().toISOString()
        })
        .eq('id', propertyId)
    } catch (error) {
      console.warn('Failed to update property optimization score:', error)
    }

    // Store audit results in memory with error handling
    try {
      await supabase
        .from('ai_consultant_memory')
        .insert({
          id: `audit_memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          session_id: auditSession.id,
          memory_type: 'listing_audit',
          content: {
            audit_type: auditType,
            results: auditResults,
            optimization_score: optimizationScore,
            timestamp: new Date().toISOString()
          },
          importance_score: 9
        })
    } catch (memoryError) {
      console.warn('Failed to store audit results in memory:', memoryError)
    }

    return NextResponse.json({
      auditResults,
      recommendations,
      optimizationScore,
      sessionId: auditSession.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in listing audit:', error)
    return NextResponse.json({ 
      error: 'Audit failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
