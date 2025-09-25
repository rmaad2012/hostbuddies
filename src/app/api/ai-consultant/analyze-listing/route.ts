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

    const { 
      propertyId, 
      analysisType = 'comprehensive',
      focusAreas = ['wording', 'revenue', 'amenities', 'pricing'] 
    } = await request.json()

    if (!propertyId) {
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

    // Get market data with location intelligence
    let marketData = {}
    try {
      marketData = await getMarketData(property.location || 'San Francisco, CA')
    } catch (error) {
      console.warn('Failed to get market data:', error)
      marketData = { averagePrice: 150, occupancyRate: 0.75, error: 'Market data unavailable' }
    }

    // Create analysis session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const analysisPrompt = `🎯 ADVANCED AIRBNB LISTING ANALYSIS & OPTIMIZATION

PROPERTY PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${property.name}
Location: ${property.location}
Current Title: "${property.title || 'Not set'}"
Description: "${property.description || 'Not set'}"
Amenities: ${JSON.stringify(property.amenities || {})}
Current Pricing: ${JSON.stringify(property.pricing_data || {})}

MARKET INTELLIGENCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(marketData, null, 2)}

🔍 ANALYSIS REQUIREMENTS:

${focusAreas.includes('wording') ? `
1. 📝 TITLE & DESCRIPTION TRANSFORMATION:
   ┌─ CURRENT TITLE ANALYSIS:
   │  • Emotional impact score (1-10)
   │  • SEO keyword density analysis  
   │  • Character count optimization
   │  • Missing power words identification
   │
   ├─ OPTIMIZED TITLE VERSIONS (provide 3):
   │  • Version A: Emotional trigger focus
   │  • Version B: Benefit/feature focus  
   │  • Version C: Local SEO focus
   │  • Expected CTR improvement for each
   │
   └─ DESCRIPTION REWRITE:
      • Storytelling structure implementation
      • Guest journey mapping integration
      • Local attraction highlighting
      • Social proof elements addition
      • Expected booking conversion improvement
` : ''}

${focusAreas.includes('revenue') ? `
2. 💰 CREATIVE REVENUE OPTIMIZATION:
   ┌─ MINI-MART SETUP:
   │  • Product selection by guest demographics
   │  • Markup percentages and profit margins
   │  • Monthly revenue projections
   │  • Initial investment and ROI timeline
   │
   ├─ LOCAL PARTNERSHIPS:
   │  • Wine/artisanal product opportunities
   │  • Experience package collaborations
   │  • Commission structures and revenue splits
   │  • Implementation contact strategies
   │
   └─ UPSELLING STRATEGIES:
      • Pre-arrival package offerings
      • During-stay convenience additions
      • Seasonal revenue boosters
      • Expected revenue per booking increase
` : ''}

${focusAreas.includes('amenities') ? `
3. 🏠 HIGH-ROI AMENITY RECOMMENDATIONS:
   ┌─ PRIORITY ADDITIONS (by ROI):
   │  • Rank top 5 amenities by property type
   │  • Cost analysis and payback periods
   │  • Booking rate impact percentages
   │  • Price premium potential
   │
   ├─ LOCATION-SPECIFIC FEATURES:
   │  • Amenities that differentiate from competitors
   │  • Guest demographic alignment
   │  • Seasonal amenity rotation strategies
   │
   └─ IMPLEMENTATION ROADMAP:
      • Phase 1: Quick wins (under $500)
      • Phase 2: Medium investments ($500-2000)
      • Phase 3: Major additions ($2000+)
` : ''}

${focusAreas.includes('pricing') ? `
4. 💲 STRATEGIC PRICING OPTIMIZATION:
   ┌─ COMPETITIVE POSITIONING:
   │  • Current price vs market analysis
   │  • Premium pricing justification factors
   │  • Psychological pricing recommendations
   │
   ├─ DYNAMIC PRICING STRATEGY:
   │  • Seasonal multipliers by month
   │  • Event-based pricing opportunities
   │  • Length-of-stay discount optimization
   │
   └─ PACKAGE PRICING:
      • Romance/family/business packages
      • Add-on service pricing
      • Total revenue impact projections
` : ''}

📊 DELIVERABLE FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Prioritize recommendations by impact vs effort
• Include specific dollar amounts and percentages
• Provide implementation timelines (days/weeks)
• Suggest supplier contacts and resources
• Calculate total potential revenue increase
• Include competitor comparison insights
• Provide before/after projections

Focus on ACTIONABLE, SPECIFIC, PROFITABLE solutions that can be implemented immediately.`

    console.log('Making AI request for advanced listing analysis')
    
    // Prepare messages for AI providers
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are HostBuddies' premier AI consultant specializing in Airbnb revenue maximization. You have analyzed over 10,000 properties and generated $50M+ in additional revenue for hosts through creative optimization strategies.

🏆 YOUR EXPERTISE:
• Psychology-driven listing optimization with 40%+ conversion improvements
• Creative revenue streams generating $500-3000 monthly per property  
• Location-specific amenity strategies with 3-6 month ROI payback
• Premium pricing psychology and dynamic pricing mastery
• Local partnership development and commission optimization

🎯 YOUR ANALYSIS STYLE:
• Always quantify recommendations with specific dollar amounts
• Provide exact implementation steps and timelines
• Include supplier suggestions and cost breakdowns
• Prioritize by ROI and effort level (quick wins first)
• Reference successful case studies and market data
• Focus on immediate actionable insights

💡 SPECIALIZATIONS:
• Mini-mart setups averaging $300-800 monthly revenue
• Romance/family/adventure package development
• Local wine/artisanal product partnerships
• Experience upselling with 20%+ commission rates
• Psychological pricing strategies boosting revenue 25-40%

Be enthusiastic, specific, and laser-focused on maximizing revenue through creative business strategies. Provide implementation roadmaps, not just suggestions.`
      },
      { role: 'user', content: analysisPrompt }
    ]
    
    // Use the new AI provider system with higher token limit for comprehensive analysis
    const aiResponse = await generateAIResponse(messages, {
      maxTokens: 3000,
      temperature: 0.2,
      model: 'gpt-4o'
    })
    
    const analysisResults = aiResponse.content
    console.log(`✅ Advanced analysis from ${aiResponse.provider} (${aiResponse.model})`)

    // Calculate improvement metrics
    const improvementProjections = {
      titleOptimization: {
        expectedCTRIncrease: '15-40%',
        timeToImplement: 'Immediate',
        cost: '$0'
      },
      revenueStreams: {
        expectedMonthlyIncrease: '$200-800',
        timeToImplement: '1-2 weeks',
        initialInvestment: '$150-500'
      },
      amenityUpgrades: {
        expectedBookingIncrease: '20-35%',
        timeToImplement: '2-8 weeks',
        averageROI: '3-6 months'
      },
      pricingOptimization: {
        expectedRevenueIncrease: '25-40%',
        timeToImplement: 'Immediate',
        cost: '$0'
      }
    }

    return NextResponse.json({
      analysisResults,
      improvementProjections,
      sessionId,
      analysisType,
      focusAreas,
      property: {
        name: property.name,
        location: property.location
      },
      marketContext: marketData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in advanced listing analysis:', error)
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
