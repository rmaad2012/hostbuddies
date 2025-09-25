import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test session creation API called')
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { propertyId } = await request.json()
    console.log('Creating test session for property:', propertyId)

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Verify the user owns this property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, user_id')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propertyError || !property) {
      console.error('Property verification error:', propertyError)
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 })
    }

    // Generate a test session ID
    const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const guestHash = `test_guest_${Date.now()}`

    // Get or create a default track for testing
    let trackId = 'test-track'
    
    // Check if test track exists, if not create it
    const { data: existingTrack } = await supabase
      .from('tracks')
      .select('id')
      .eq('id', trackId)
      .single()

    if (!existingTrack) {
      console.log('Creating test track...')
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          id: trackId,
          name: 'AI Chat Test',
          description: 'Test track for AI chat functionality',
          total_steps: 1,
          badge_emoji: '🤖'
        })

      if (trackError) {
        console.error('Error creating test track:', trackError)
        // Continue anyway, we'll handle missing track gracefully
      }

      // Create a simple test step
      const { error: stepError } = await supabase
        .from('track_steps')
        .insert({
          id: 'test-step-1',
          track_id: trackId,
          order_idx: 1,
          prompt: 'Ask me anything about your property!',
          quest_type: 'text'
        })

      if (stepError) {
        console.error('Error creating test step:', stepError)
      }
    }

    // Create the test guest session
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
      console.error('Error creating test session:', sessionError)
      return NextResponse.json({ error: 'Failed to create test session' }, { status: 500 })
    }

    console.log('Test session created successfully:', sessionId)
    return NextResponse.json({ sessionId })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
