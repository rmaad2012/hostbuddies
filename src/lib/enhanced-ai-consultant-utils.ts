import { createServerSupabaseClient } from './supabase-server'
import { generateAIResponse, type AIMessage } from './ai-providers'

// Types for enhanced features
export interface KnowledgeBaseDocument {
  id: string
  user_id: string
  session_id: string
  document_name: string
  document_type: 'pdf' | 'text' | 'url' | 'markdown'
  file_path?: string
  content_text: string
  content_summary?: string
  metadata: any
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface WebScrapedListing {
  id: string
  user_id: string
  session_id: string
  url: string
  listing_title?: string
  listing_description?: string
  price_data?: any
  amenities?: any
  photos_data?: any
  reviews_summary?: any
  location_data?: any
  scraping_status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
}

// Enhanced memory management
export async function getEnhancedMemory(sessionId: string, supabase: any) {
  try {
    const { data: memory } = await supabase
      .from('ai_consultant_memory')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    // Try to get enhanced features, but handle gracefully if tables don't exist
    let documents = []
    let scrapedListings = []

    try {
      const { data: docsData } = await supabase
        .from('knowledge_base_documents')
        .select('*')
        .eq('session_id', sessionId)
        .eq('processing_status', 'completed')
      documents = docsData || []
    } catch (error) {
      console.warn('knowledge_base_documents table not available:', error)
    }

    try {
      const { data: scrapedData } = await supabase
        .from('web_scraped_listings')
        .select('*')
        .eq('session_id', sessionId)
        .eq('scraping_status', 'completed')
      scrapedListings = scrapedData || []
    } catch (error) {
      console.warn('web_scraped_listings table not available:', error)
    }

    return {
      conversationHistory: memory || [],
      knowledgeBase: documents,
      scrapedListings: scrapedListings
    }
  } catch (error) {
    console.error('Error getting enhanced memory:', error)
    return {
      conversationHistory: [],
      knowledgeBase: [],
      scrapedListings: []
    }
  }
}

// PDF Processing
export async function processPDFDocument(
  file: Buffer,
  documentName: string,
  sessionId: string,
  userId: string,
  supabase: any
): Promise<string> {
  try {
    // Create document record
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await supabase
      .from('knowledge_base_documents')
      .insert({
        id: documentId,
        user_id: userId,
        session_id: sessionId,
        document_name: documentName,
        document_type: 'pdf',
        processing_status: 'processing',
        metadata: { file_size: file.length }
      })

    // Parse PDF with dynamic import
    const pdfParse = (await import('pdf-parse')).default
    const pdfData = await pdfParse(file)
    const extractedText = pdfData.text

    // Generate AI summary of the document
    const summaryMessages: AIMessage[] = [
      {
        role: 'system',
        content: `You are analyzing a document uploaded to an Airbnb optimization platform. 
        Summarize the key insights, strategies, tips, or data that would be relevant for 
        improving Airbnb listings, pricing, or guest experiences. Focus on actionable insights.`
      },
      {
        role: 'user',
        content: `Please summarize this document for Airbnb optimization context:\n\n${extractedText.substring(0, 4000)}`
      }
    ]

    const summaryResponse = await generateAIResponse(summaryMessages, {
      maxTokens: 500,
      temperature: 0.3
    })

    // Update document with extracted content
    await supabase
      .from('knowledge_base_documents')
      .update({
        content_text: extractedText,
        content_summary: summaryResponse.content,
        processing_status: 'completed'
      })
      .eq('id', documentId)

    // Store in memory for immediate access
    await supabase
      .from('ai_consultant_memory')
      .insert({
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        memory_type: 'knowledge_base_document',
        content: {
          document_id: documentId,
          document_name: documentName,
          summary: summaryResponse.content,
          key_insights: extractedText.substring(0, 1000)
        },
        importance_score: 8
      })

    return documentId
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw new Error('Failed to process PDF document')
  }
}

// Web Scraping for Airbnb listings
export async function scrapeAirbnbListing(
  url: string,
  sessionId: string,
  userId: string,
  supabase: any
): Promise<string> {
  try {
    const scrapedId = `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create scraping record
    await supabase
      .from('web_scraped_listings')
      .insert({
        id: scrapedId,
        user_id: userId,
        session_id: sessionId,
        url,
        scraping_status: 'processing'
      })

    console.log('🔍 Starting enhanced Airbnb scraping...')
    
    // Use the enhanced scraper
    const { airbnbScraper } = await import('./enhanced-scraper')
    const scrapedData = await airbnbScraper.scrapeAirbnbListing(url)
    
    console.log('✅ Enhanced scraping completed:', {
      title: scrapedData.title?.substring(0, 50) + '...',
      hasDescription: !!scrapedData.description,
      hasPrice: !!scrapedData.price,
      amenitiesCount: scrapedData.amenities?.length || 0,
      hasLocation: !!scrapedData.location,
      photosCount: scrapedData.photos?.length || 0,
      hasReviews: !!scrapedData.reviews
    })

    // Calculate comprehensive listing score
    const { calculateListingScore } = await import('./listing-audit-scorer')
    const listingScore = calculateListingScore(scrapedData)

    // Generate AI analysis with scoring context
    const analysisMessages: AIMessage[] = [
      {
        role: 'system',
        content: `You are HostBuddies' elite Airbnb optimization specialist. You've just analyzed a listing and calculated detailed scores. Provide a comprehensive audit with specific, actionable recommendations.

🎯 AUDIT FRAMEWORK:
- Lead with the overall score and key insights
- Highlight the top 3 improvement priorities
- Provide specific implementation steps
- Quantify potential revenue increases
- Be enthusiastic and solution-focused`
      },
      {
        role: 'user',
        content: `LISTING AUDIT RESULTS:

📊 OVERALL SCORE: ${listingScore.overall}/100
🎯 REVENUE POTENTIAL: ${listingScore.revenue_increase_potential}

DETAILED BREAKDOWN:
• Title: ${listingScore.breakdown.title.score}/100 - ${listingScore.breakdown.title.feedback}
• Description: ${listingScore.breakdown.description.score}/100 - ${listingScore.breakdown.description.feedback}
• Pricing: ${listingScore.breakdown.pricing.score}/100 - ${listingScore.breakdown.pricing.feedback}
• Amenities: ${listingScore.breakdown.amenities.score}/100 - ${listingScore.breakdown.amenities.feedback}
• Photos: ${listingScore.breakdown.photos.score}/100 - ${listingScore.breakdown.photos.feedback}
• Revenue Opportunities: ${listingScore.breakdown.revenue_potential.score}/100 - ${listingScore.breakdown.revenue_potential.feedback}

TOP IMPROVEMENT PRIORITIES:
${listingScore.improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

SCRAPED DATA:
URL: ${url}
Title: ${scrapedData.title}
Description: ${scrapedData.description?.substring(0, 300)}...
Price: ${scrapedData.price}
Amenities: ${JSON.stringify(scrapedData.amenities?.slice(0, 10))}
Location: ${scrapedData.location}

Provide a comprehensive optimization strategy with specific action items.`
      }
    ]

    const analysisResponse = await generateAIResponse(analysisMessages, {
      maxTokens: 1000,
      temperature: 0.3
    })

    // Update scraped listing record with enhanced data
    await supabase
      .from('web_scraped_listings')
      .update({
        listing_title: scrapedData.title,
        listing_description: scrapedData.description,
        price_data: { 
          raw_price: scrapedData.price,
          bedrooms: scrapedData.bedrooms,
          bathrooms: scrapedData.bathrooms,
          guests: scrapedData.guests
        },
        amenities: scrapedData.amenities,
        location_data: { 
          raw_location: scrapedData.location,
          property_type: scrapedData.propertyType
        },
        photos: scrapedData.photos,
        reviews_data: scrapedData.reviews,
        host_info: scrapedData.hostInfo,
        scraping_status: 'completed'
      })
      .eq('id', scrapedId)

    // Store analysis and scoring in memory
    await supabase
      .from('ai_consultant_memory')
      .insert({
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        memory_type: 'web_scraped_listing_audit',
        content: {
          scraped_id: scrapedId,
          url,
          title: scrapedData.title,
          analysis: analysisResponse.content,
          key_insights: scrapedData,
          audit_score: listingScore
        },
        importance_score: 8 // Higher importance for scored audits
      })

    return scrapedId

  } catch (error) {
    console.error('❌ Enhanced scraping failed:', error)
    
    try {
      // Update record with error status
      await supabase
        .from('web_scraped_listings')
        .update({
          scraping_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scrapedId)
    } catch (dbError) {
      console.error('Failed to update scraping status:', dbError)
    }

    throw new Error(`Enhanced scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Enhanced extraction helper functions
function extractTitle($: any): string {
  // Multiple strategies for title extraction
  const titleSelectors = [
    'h1[data-testid="listing-title"]',
    'h1._fecoyn4',
    'h1[class*="title"]',
    'h1',
    '[data-testid="listing-title"]',
    'meta[property="og:title"]'
  ]
  
  for (const selector of titleSelectors) {
    const title = $(selector).first().text().trim()
    if (title && title.length > 10) return title
  }
  
  return 'Title not found'
}

function extractDescription($: any): string {
  const descSelectors = [
    '[data-section-id="DESCRIPTION_DEFAULT"] span',
    '[data-testid="listing-description"]',
    '.description span',
    'meta[property="og:description"]',
    'meta[name="description"]'
  ]
  
  for (const selector of descSelectors) {
    const desc = $(selector).first().text().trim()
    if (desc && desc.length > 50) return desc
  }
  
  return 'Description not found'
}

function extractPrice($: any): string {
  const priceSelectors = [
    '[data-testid="price-availability-row"]',
    '[data-testid="pricing-header"]',
    '[class*="price"]',
    '[data-testid="price-per-night"]'
  ]
  
  for (const selector of priceSelectors) {
    const price = $(selector).first().text().trim()
    if (price && price.includes('$')) return price
  }
  
  return 'Price not found'
}

function extractAmenities($: any): string[] {
  const amenities: string[] = []
  const amenitySelectors = [
    '[data-section-id="AMENITIES_DEFAULT"] button',
    '[data-testid="amenity-item"]',
    '.amenity-item',
    '[class*="amenity"]'
  ]
  
  amenitySelectors.forEach(selector => {
    $(selector).each((i, el) => {
      const amenity = $(el).text().trim()
      if (amenity && !amenities.includes(amenity)) {
        amenities.push(amenity)
      }
    })
  })
  
  return amenities.slice(0, 20) // Limit to first 20 amenities
}

function extractLocation($: any): string {
  const locationSelectors = [
    '[data-section-id="LOCATION_DEFAULT"]',
    '[data-testid="listing-location"]',
    '.location',
    'meta[property="og:locality"]'
  ]
  
  for (const selector of locationSelectors) {
    const location = $(selector).first().text().trim()
    if (location && location.length > 3) return location
  }
  
  return 'Location not found'
}

function extractPhotos($: any): string[] {
  const photos: string[] = []
  const photoSelectors = [
    '[data-testid="listing-photo"] img',
    '.listing-image img',
    '[class*="photo"] img'
  ]
  
  photoSelectors.forEach(selector => {
    $(selector).each((i, el) => {
      const src = $(el).attr('src')
      if (src && !photos.includes(src)) {
        photos.push(src)
      }
    })
  })
  
  return photos.slice(0, 10) // Limit to first 10 photos
}

function extractReviewData($: any): any {
  const rating = $('[data-testid="listing-rating"]').first().text().trim() || 
                $('[class*="rating"]').first().text().trim() || 
                'Rating not found'
                
  const reviewCount = $('[data-testid="review-count"]').first().text().trim() ||
                     $('[class*="review-count"]').first().text().trim() ||
                     'Review count not found'
                     
  return { rating, reviewCount }
}

function extractHostInfo($: any): any {
  const hostName = $('[data-testid="host-name"]').first().text().trim() ||
                  $('[class*="host-name"]').first().text().trim() ||
                  'Host name not found'
                  
  const hostSince = $('[data-testid="host-since"]').first().text().trim() ||
                   $('[class*="host-since"]').first().text().trim() ||
                   'Host since not found'
                   
  return { hostName, hostSince }
}

// Enhanced fallback meta data extraction
async function extractMetaData(url: string): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HostBuddies/1.0; +https://hostbuddies.com/bot)'
      }
    })
    
      const html = await response.text()
      const cheerio = await import('cheerio')
      const $ = cheerio.load(html)

    return {
      title: $('meta[property="og:title"]').attr('content') || 
             $('meta[name="title"]').attr('content') || 
             $('title').text() || 'Title not available',
      description: $('meta[property="og:description"]').attr('content') || 
                  $('meta[name="description"]').attr('content') || 
                  'Description not available',
      price: 'Price information not available',
      amenities: [],
      location: $('meta[property="og:locality"]').attr('content') || 'Location not available'
    }
  } catch (error) {
    console.error('Meta data extraction failed:', error)
    return {
      title: 'Unable to extract title',
      description: 'Unable to extract description', 
      price: 'Unable to extract price',
      amenities: [],
      location: 'Unable to extract location'
    }
  }
}

// Enhanced context building for AI
export function buildEnhancedContext(memory: any, property: any): string {
  const { conversationHistory, knowledgeBase, scrapedListings } = memory

  let context = `PROPERTY CONTEXT:\n`
  if (property) {
    context += `Property: ${property.name}\n`
    context += `Location: ${property.location || 'Not specified'}\n`
    context += `Current Title: ${property.title || 'Not set'}\n`
    context += `Description: ${property.description || 'Not set'}\n`
    context += `Amenities: ${JSON.stringify(property.amenities || {})}\n\n`
  }

  // Add knowledge base context
  if (knowledgeBase.length > 0) {
    context += `KNOWLEDGE BASE INSIGHTS:\n`
    knowledgeBase.forEach((doc: KnowledgeBaseDocument) => {
      context += `Document: ${doc.document_name}\n`
      context += `Summary: ${doc.content_summary}\n`
      context += `Key Content: ${doc.content_text?.substring(0, 500)}...\n\n`
    })
  }

  // Add scraped listings context
  if (scrapedListings.length > 0) {
    context += `COMPETITOR ANALYSIS (from scraped listings):\n`
    scrapedListings.forEach((listing: WebScrapedListing) => {
      context += `URL: ${listing.url}\n`
      context += `Title: ${listing.listing_title}\n`
      context += `Price: ${JSON.stringify(listing.price_data)}\n`
      context += `Amenities: ${JSON.stringify(listing.amenities)}\n\n`
    })
  }

  // Add conversation history
  if (conversationHistory.length > 0) {
    context += `CONVERSATION HISTORY:\n`
    conversationHistory.slice(-5).forEach((mem: any) => {
      if (mem.memory_type === 'conversation_history') {
        context += `User: ${mem.content.user_message}\n`
        context += `Assistant: ${mem.content.ai_response?.substring(0, 200)}...\n\n`
      }
    })
  }

  return context
}

// Smart memory storage with importance scoring
export async function storeEnhancedMemory(
  sessionId: string,
  memoryType: string,
  content: any,
  importance: number,
  supabase: any
) {
  try {
    await supabase
      .from('ai_consultant_memory')
      .insert({
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        memory_type: memoryType,
        content,
        importance_score: importance
      })
  } catch (error) {
    console.error('Error storing enhanced memory:', error)
  }
}
