import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Get guest session with property information
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select(`
        id,
        property_id,
        guest_hash,
        track_id,
        points,
        status,
        created_at
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session fetch error:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Guest session creation API called')
    const supabase = await createServerSupabaseClient()
    
    const { propertyId } = await request.json()
    console.log('Creating guest session for property:', propertyId)

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Verify the property exists and is active
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, status')
      .eq('id', propertyId)
      .eq('status', 'active')
      .single()

    if (propertyError || !property) {
      console.error('Property verification error:', propertyError)
      return NextResponse.json({ error: 'Property not found or inactive' }, { status: 404 })
    }

    // Generate a guest session ID and hash
    const sessionId = `guest_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const guestHash = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // Get or create a default track for guests
    let trackId = 'guest-chat-track'
    
    // Check if guest chat track exists, if not create it
    const { data: existingTrack } = await supabase
      .from('tracks')
      .select('id')
      .eq('id', trackId)
      .single()

    if (!existingTrack) {
      console.log('Creating guest chat track...')
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          id: trackId,
          name: 'AI Chat Experience',
          description: 'Chat with your AI host for property information and assistance',
          total_steps: 1,
          badge_emoji: '🤖'
        })

      if (trackError) {
        console.error('Error creating guest track:', trackError)
        // Continue anyway, we'll handle missing track gracefully
      }

      // Create a simple chat step
      const { error: stepError } = await supabase
        .from('track_steps')
        .insert({
          id: 'guest-chat-step-1',
          track_id: trackId,
          order_idx: 1,
          prompt: 'Welcome! Ask me anything about your stay.',
          quest_type: 'text'
        })

      if (stepError) {
        console.error('Error creating guest step:', stepError)
      }
    }

    // Create the guest session
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({
        id: sessionId,
        property_id: propertyId,
        guest_hash: guestHash,
        track_id: trackId,
        points: 0,
        status: 'active'
      })
      .select()

    if (sessionError) {
      console.error('Error creating guest session:', sessionError)
      return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 })
    }

    console.log('Guest session created successfully:', sessionId)
    return NextResponse.json({ sessionId, propertyName: property.name })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
