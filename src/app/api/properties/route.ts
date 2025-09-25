import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('Property creation API called')
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Server-side user:', user?.id)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const propertyData = await request.json()
    console.log('Property data received:', propertyData)

    // Sanitize text fields to prevent Unicode issues
    const sanitizeText = (text: string | null | undefined): string => {
      if (!text) return ''
      // Remove null bytes and other problematic characters
      return text.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }

    // Sanitize all text fields
    const sanitizedData = {
      ...propertyData,
      name: sanitizeText(propertyData.name),
      guidebook_content: sanitizeText(propertyData.guidebook_content),
      check_in_instructions: sanitizeText(propertyData.check_in_instructions),
      wifi_name: sanitizeText(propertyData.wifi_name),
      wifi_password: sanitizeText(propertyData.wifi_password),
      trash_day: sanitizeText(propertyData.trash_day),
      quiet_hours: sanitizeText(propertyData.quiet_hours),
    }

    // Generate property ID
    const propertyId = `prop_${Date.now()}`

    // Insert property into database using server-side auth context
    const { data, error } = await supabase
      .from('properties')
      .insert({
        id: propertyId,
        user_id: user.id, // This will match auth.uid() in RLS policies
        ...sanitizedData,
        status: 'active'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Property created successfully:', propertyId)

    // If guidebook content was provided, process it with AI
    if (sanitizedData.guidebook_content && sanitizedData.guidebook_content.trim()) {
      try {
        console.log('Processing guidebook content for property:', propertyId)
        
        // Create a new request to process the guidebook
        const guidebookProcessRequest = new Request(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/guidebook/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward auth headers
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            propertyId,
            guidebookContent: sanitizedData.guidebook_content,
            guidebookUrl: sanitizedData.guidebook_url
          })
        })

        // Process in background (don't wait for it)
        fetch(guidebookProcessRequest).then(async (processResponse) => {
          if (processResponse.ok) {
            const processResult = await processResponse.json()
            console.log('Guidebook processed successfully:', processResult.knowledgeBaseEntries, 'entries created')
          } else {
            console.warn('Failed to process guidebook:', await processResponse.text())
          }
        }).catch(error => {
          console.warn('Error processing guidebook (non-critical):', error)
        })
      } catch (error) {
        console.warn('Error initiating guidebook processing (non-critical):', error)
      }
    }

    return NextResponse.json({ propertyId, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
