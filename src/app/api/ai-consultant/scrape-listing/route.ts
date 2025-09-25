import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { scrapeAirbnbListing } from '@/lib/enhanced-ai-consultant-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, sessionId } = await request.json()

    if (!url || !sessionId) {
      return NextResponse.json({ error: 'Missing URL or sessionId' }, { status: 400 })
    }

    // Validate URL format
    try {
      const urlObj = new URL(url)
      if (!urlObj.hostname.includes('airbnb.com') && !urlObj.hostname.includes('airbnb.')) {
        return NextResponse.json({ 
          error: 'Please provide a valid Airbnb listing URL' 
        }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Check if URL has already been scraped recently
    const { data: existingListing } = await supabase
      .from('web_scraped_listings')
      .select('*')
      .eq('url', url)
      .eq('user_id', user.id)
      .eq('scraping_status', 'completed')
      .gte('scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours ago
      .single()

    if (existingListing) {
      return NextResponse.json({
        success: true,
        scrapedId: existingListing.id,
        message: 'Using cached listing data from recent scrape',
        cached: true
      })
    }

    // Scrape the listing
    const scrapedId = await scrapeAirbnbListing(url, sessionId, user.id, supabase)

    return NextResponse.json({
      success: true,
      scrapedId,
      message: 'Listing scraped and analyzed successfully'
    })

  } catch (error) {
    console.error('Error scraping listing:', error)
    return NextResponse.json({
      error: 'Failed to scrape listing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get scraped listing data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const scrapedId = searchParams.get('scrapedId')

    if (scrapedId) {
      // Get specific scraped listing
      const { data: listing, error } = await supabase
        .from('web_scraped_listings')
        .select('*')
        .eq('id', scrapedId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }

      return NextResponse.json({ listing })
    }

    if (sessionId) {
      // Get all scraped listings for session
      const { data: listings, error } = await supabase
        .from('web_scraped_listings')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
      }

      return NextResponse.json({ listings })
    }

    return NextResponse.json({ error: 'Missing sessionId or scrapedId parameter' }, { status: 400 })

  } catch (error) {
    console.error('Error fetching scraped listings:', error)
    return NextResponse.json({
      error: 'Failed to fetch scraped listings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
