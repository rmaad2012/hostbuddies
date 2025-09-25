import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Get the property with guidebook content
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 })
    }

    if (!property.guidebook_content || !property.guidebook_content.trim()) {
      return NextResponse.json({ error: 'No guidebook content found for this property' }, { status: 400 })
    }

    // Process the guidebook
    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/guidebook/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        propertyId,
        guidebookContent: property.guidebook_content,
        guidebookUrl: property.guidebook_url
      })
    })

    if (!processResponse.ok) {
      const errorText = await processResponse.text()
      return NextResponse.json({ 
        error: 'Failed to process guidebook', 
        details: errorText 
      }, { status: 500 })
    }

    const result = await processResponse.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error reprocessing guidebook:', error)
    return NextResponse.json({
      error: 'Failed to reprocess guidebook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
