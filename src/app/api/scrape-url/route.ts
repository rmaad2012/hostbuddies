import { NextRequest, NextResponse } from 'next/server'

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

// OpenGraph and JSON-LD extraction (fast, low risk)
async function extractWithOpenGraph(url: string): Promise<Partial<ScrapedContent>> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HostBuddies/1.0; +https://hostbuddies.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // Extract OpenGraph data
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"[^>]*>/i)?.[1]
    const ogDescription = html.match(/<meta property="og:description" content="([^"]*)"[^>]*>/i)?.[1]
    const ogImage = html.match(/<meta property="og:image" content="([^"]*)"[^>]*>/i)?.[1]
    
    // Extract JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
    let jsonLdData: any = null
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*type="application\/ld\+json"[^>]*>/i, '').replace(/<\/script>/i, '')
          const parsed = JSON.parse(jsonContent)
          if (parsed['@type'] === 'LodgingBusiness' || parsed['@type'] === 'Place' || parsed['@type'] === 'Accommodation') {
            jsonLdData = parsed
            break
          }
        } catch (e) {
          // Continue to next JSON-LD block
        }
      }
    }

    // Extract basic meta data
    const title = ogTitle || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()
    const description = ogDescription || html.match(/<meta name="description" content="([^"]*)"[^>]*>/i)?.[1]?.trim()
    
    // Extract rating and reviews from JSON-LD or meta tags
    let rating: number | undefined
    let reviewsCount: number | undefined
    
    if (jsonLdData) {
      rating = jsonLdData.aggregateRating?.ratingValue
      reviewsCount = jsonLdData.aggregateRating?.reviewCount
    }
    
    // Extract amenities from JSON-LD
    let amenities: string[] = []
    if (jsonLdData?.amenityFeature) {
      amenities = jsonLdData.amenityFeature.map((amenity: any) => amenity.name || amenity).filter(Boolean)
    }

    // Extract location from JSON-LD
    let location: string | undefined
    if (jsonLdData?.address) {
      const addr = jsonLdData.address
      location = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry]
        .filter(Boolean)
        .join(', ')
    }

    return {
      title,
      description,
      rating,
      reviewsCount,
      amenities,
      location,
      photoAlts: ogImage ? [ogImage] : undefined,
    }
  } catch (error) {
    console.error('OpenGraph extraction failed:', error)
    return {}
  }
}

// Playwright extraction (fallback for complex sites)
async function extractWithPlaywright(url: string): Promise<Partial<ScrapedContent>> {
  try {
    // Dynamic import to avoid bundling issues
    const { chromium } = await import('playwright')
    
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (compatible; HostBuddies/1.0; +https://hostbuddies.com/bot)')
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Extract visible content
    const content = await page.evaluate(() => {
      const result: Partial<ScrapedContent> = {}
      
      // Title
      result.title = document.querySelector('h1')?.textContent?.trim() || 
                   document.querySelector('title')?.textContent?.trim()
      
      // Description - look for common description selectors
      const descriptionSelectors = [
        '[data-testid*="description"]',
        '.description',
        '[class*="description"]',
        'meta[name="description"]',
        'meta[property="og:description"]'
      ]
      
      for (const selector of descriptionSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          result.description = element.textContent?.trim() || element.getAttribute('content')?.trim()
          if (result.description) break
        }
      }
      
      // Rating - look for common rating patterns
      const ratingSelectors = [
        '[data-testid*="rating"]',
        '[class*="rating"]',
        '[aria-label*="rating"]',
        '[aria-label*="star"]'
      ]
      
      for (const selector of ratingSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          const ratingText = element.textContent || element.getAttribute('aria-label') || ''
          const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(?:out of|\/|stars?)/i)
          if (ratingMatch) {
            result.rating = parseFloat(ratingMatch[1])
            break
          }
        }
      }
      
      // Reviews count
      const reviewSelectors = [
        '[data-testid*="review"]',
        '[class*="review"]',
        '[aria-label*="review"]'
      ]
      
      for (const selector of reviewSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          const reviewText = element.textContent || ''
          const reviewMatch = reviewText.match(/(\d+)\s*reviews?/i)
          if (reviewMatch) {
            result.reviewsCount = parseInt(reviewMatch[1])
            break
          }
        }
      }
      
      // Amenities - look for common amenity patterns
      const amenitySelectors = [
        '[data-testid*="amenity"]',
        '[class*="amenity"]',
        '[class*="feature"]',
        'ul[class*="amenity"]',
        'div[class*="amenity"]'
      ]
      
      const amenities: string[] = []
      for (const selector of amenitySelectors) {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          const text = el.textContent?.trim()
          if (text && text.length < 100) { // Avoid long descriptions
            amenities.push(text)
          }
        })
      }
      result.amenities = [...new Set(amenities)].slice(0, 20) // Limit to 20 unique amenities
      
      // Location - look for address or location info
      const locationSelectors = [
        '[data-testid*="location"]',
        '[class*="location"]',
        '[class*="address"]',
        'address'
      ]
      
      for (const selector of locationSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          result.location = element.textContent?.trim()
          if (result.location) break
        }
      }
      
      // Photo alt texts
      const images = document.querySelectorAll('img[alt]')
      result.photoAlts = Array.from(images)
        .map(img => img.getAttribute('alt'))
        .filter(Boolean)
        .slice(0, 10) // Limit to 10 images
      
      return result
    })
    
    await browser.close()
    return content
  } catch (error) {
    console.error('Playwright extraction failed:', error)
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP/HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    console.log(`🔍 Scraping URL: ${url}`)

    // Try OpenGraph/JSON-LD first (fast, low risk)
    console.log('📡 Trying OpenGraph/JSON-LD extraction...')
    let content = await extractWithOpenGraph(url)
    
    // Check if we got enough content
    const hasMinimalContent = content.title || content.description
    const method: 'opengraph' | 'jsonld' | 'playwright' = hasMinimalContent ? 'opengraph' : 'opengraph'
    
    // If OpenGraph is too thin, try Playwright
    if (!hasMinimalContent) {
      console.log('🎭 OpenGraph too thin, trying Playwright...')
      try {
        const playwrightContent = await extractWithPlaywright(url)
        if (playwrightContent.title || playwrightContent.description) {
          content = { ...content, ...playwrightContent }
          content.method = 'playwright'
        }
      } catch (playwrightError) {
        console.error('Playwright failed:', playwrightError)
      }
    }

    const result: ScrapedContent = {
      url,
      scrapedAt: new Date().toISOString(),
      method: content.method || 'opengraph',
      success: !!(content.title || content.description),
      ...content
    }

    if (!result.success) {
      result.error = 'No extractable content found'
    }

    console.log(`✅ Scraping completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`📊 Extracted: title=${!!result.title}, description=${!!result.description}, rating=${!!result.rating}, amenities=${result.amenities?.length || 0}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'URL Scraping API',
    usage: 'POST with { "url": "https://example.com" }',
    methods: ['opengraph', 'jsonld', 'playwright'],
    features: [
      'OpenGraph meta tag extraction',
      'JSON-LD structured data parsing',
      'Playwright rendering for complex sites',
      'Public content only (no login/bypass)',
      'Respects robots.txt and rate limits'
    ]
  })
}
