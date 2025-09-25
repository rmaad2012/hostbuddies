import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateAIResponse } from '@/lib/ai-providers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId, guidebookContent, guidebookUrl } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Verify user owns the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 })
    }

    // If we have guidebook content, process it with AI
    let processedContent = guidebookContent || ''
    let aiSummary = ''

    if (guidebookContent && guidebookContent.trim()) {
      try {
        // Generate AI summary of the guidebook
        const summaryMessages = [
          {
            role: 'system' as const,
            content: `You are analyzing a property guidebook for an Airbnb listing. 
            Extract key information that would be helpful for:
            1. Answering guest questions
            2. Providing property-specific recommendations
            3. Check-in/check-out procedures
            4. Local area information
            5. House rules and amenities
            
            Summarize the most important points that an AI assistant should remember when helping guests.`
          },
          {
            role: 'user' as const,
            content: `Please analyze this property guidebook and extract key information:\n\n${guidebookContent.substring(0, 4000)}`
          }
        ]

        const summaryResponse = await generateAIResponse(summaryMessages, {
          maxTokens: 800,
          temperature: 0.3
        })

        aiSummary = summaryResponse.content
      } catch (error) {
        console.warn('Failed to generate AI summary:', error)
        aiSummary = 'Guidebook content available but summary generation failed'
      }
    }

    // Update the property with guidebook information
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        guidebook_content: processedContent,
        guidebook_url: guidebookUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Error updating property:', updateError)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }

    // Create or update knowledge base entries for the AI consultant
    if (aiSummary) {
      // Check if we already have a guidebook entry for this property
      const { data: existingKb } = await supabase
        .from('kb_docs')
        .select('id')
        .eq('property_id', propertyId)
        .eq('question', 'Property Guidebook Summary')
        .single()

      if (existingKb) {
        // Update existing entry
        await supabase
          .from('kb_docs')
          .update({
            answer: aiSummary,
            user_id: user.id
          })
          .eq('id', existingKb.id)
      } else {
        // Create new entry
        await supabase
          .from('kb_docs')
          .insert({
            id: `kb_guidebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            property_id: propertyId,
            user_id: user.id,
            question: 'Property Guidebook Summary',
            answer: aiSummary
          })
      }

      // Also create entries for common questions
      const commonQuestions = [
        {
          question: 'Check-in instructions',
          context: 'check-in, arrival, keys, access'
        },
        {
          question: 'WiFi and internet',
          context: 'wifi, internet, password, network'
        },
        {
          question: 'House rules',
          context: 'rules, quiet hours, smoking, pets'
        },
        {
          question: 'Local recommendations',
          context: 'restaurants, attractions, local area'
        },
        {
          question: 'Amenities and facilities',
          context: 'amenities, kitchen, laundry, parking'
        }
      ]

      for (const item of commonQuestions) {
        try {
          // Extract specific information for each category
          const extractMessages = [
            {
              role: 'system' as const,
              content: `Extract information about "${item.question}" from this property guidebook. 
              Focus on: ${item.context}. 
              If no relevant information is found, respond with "No specific information provided in guidebook."`
            },
            {
              role: 'user' as const,
              content: `Extract information about "${item.question}" from:\n\n${guidebookContent.substring(0, 3000)}`
            }
          ]

          const extractResponse = await generateAIResponse(extractMessages, {
            maxTokens: 300,
            temperature: 0.2
          })

          const extractedInfo = extractResponse.content

          if (extractedInfo && !extractedInfo.includes('No specific information')) {
            // Check if entry exists
            const { data: existingEntry } = await supabase
              .from('kb_docs')
              .select('id')
              .eq('property_id', propertyId)
              .eq('question', item.question)
              .single()

            if (existingEntry) {
              await supabase
                .from('kb_docs')
                .update({
                  answer: extractedInfo,
                  user_id: user.id
                })
                .eq('id', existingEntry.id)
            } else {
              await supabase
                .from('kb_docs')
                .insert({
                  id: `kb_${item.question.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  property_id: propertyId,
                  user_id: user.id,
                  question: item.question,
                  answer: extractedInfo
                })
            }
          }
        } catch (error) {
          console.warn(`Failed to extract ${item.question}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Guidebook processed successfully',
      summary: aiSummary,
      knowledgeBaseEntries: aiSummary ? 6 : 0 // Main summary + 5 categories
    })

  } catch (error) {
    console.error('Error processing guidebook:', error)
    return NextResponse.json({
      error: 'Failed to process guidebook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
