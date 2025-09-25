import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params
    console.log('Fetching property details for:', propertyId)
    
    const supabase = await createServerSupabaseClient()
    
    // Get property information (no auth required for guest access)
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, name, persona_style, wifi_name, wifi_password, check_in_instructions, trash_day, quiet_hours, checkin_video_url, status')
      .eq('id', propertyId)
      .eq('status', 'active') // Only return active properties
      .single()

    if (error || !property) {
      console.error('Property not found:', error)
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    console.log('Property found:', property.name)
    return NextResponse.json(property)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
