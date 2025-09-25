import { NextRequest, NextResponse } from 'next/server'
import { getKbDocs } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateGuestAIResponse, getGuestFallbackResponse, type GuestAIMessage } from '@/lib/guest-ai-providers'

export async function POST(request: NextRequest) {
  let message = '';
  
  try {
    console.log('Chat API called')
    const { message: userMessage, propertyId, sessionId } = await request.json()
    message = userMessage; // Store for fallback use
    console.log('Request data:', { message, propertyId, sessionId })

    if (!message || !propertyId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get property details and knowledge base documents
    console.log('Fetching property details for:', propertyId)
    const supabase = await createServerSupabaseClient()
    
    // Get property information
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()
    
    if (propertyError) {
      console.error('Error fetching property:', propertyError)
    }

    // Get knowledge base documents for this property
    console.log('Fetching KB docs for property:', propertyId)
    const kbDocs = await getKbDocs(propertyId)
    console.log('KB docs found:', kbDocs.length)
    
    // Create context from knowledge base
    const kbContext = kbDocs.map(doc => `Q: ${doc.question}\nA: ${doc.answer}`).join('\n\n')

    // Get local area information based on property location
    const getLocationContext = async (location: string) => {
      if (!location) return ''
      
      try {
        // Extract city/area from location string
        const cityMatch = location.match(/([^,]+),\s*([^,]+)/)
        const area = cityMatch ? `${cityMatch[1].trim()}, ${cityMatch[2].trim()}` : location
        
        return `
LOCAL AREA CONTEXT:
- Property Location: ${area}
- Use your knowledge of ${area} to provide specific local recommendations
- Include nearby attractions, restaurants, coffee shops, grocery stores, and transportation options
- Provide walking times and distances when possible
- Consider local culture, events, and seasonal activities
- Recommend based on current time of day and day of week when relevant`
      } catch (error) {
        console.warn('Error processing location context:', error)
        return ''
      }
    }

    const locationContext = await getLocationContext(property?.location || '')

    // Build comprehensive property information section
    const propertyInfo = property ? `
PROPERTY INFORMATION:
- Property Name: ${property.name}
- Location: ${property.location || 'Not specified'}
- WiFi Network: ${property.wifi_name || 'Please ask your host for WiFi details'}
- WiFi Password: ${property.wifi_password || 'Please ask your host for WiFi password'}
- Check-in Instructions: ${property.check_in_instructions || 'Standard check-in process - refer to your booking confirmation'}
- Check-out Time: ${property.checkout_time || '11:00 AM (standard)'}
- Trash Collection: ${property.trash_day || 'Please ask your host about trash collection schedule'}
- Quiet Hours: ${property.quiet_hours || 'Please be considerate of neighbors, especially after 10 PM'}
- House Rules: ${property.house_rules || 'Please follow standard guest etiquette'}
- Emergency Contact: ${property.host_contact || 'Contact information available in your booking'}
- Max Guests: ${property.max_guests || 'As per booking'}
- Parking: ${property.parking_info || 'Please check with host about parking arrangements'}
${property.checkin_video_url ? `- Check-in Video Available: I can provide access to a helpful check-in video tutorial` : ''}
${property.local_recommendations ? `- Host's Local Tips: ${property.local_recommendations}` : ''}
` : ''

    // Enhanced system prompt for professional guest assistant
    const systemPrompt = `You are a professional AI guest assistant for "${property?.name || 'this property'}". You are knowledgeable, helpful, and focused on ensuring guests have an excellent stay.

YOUR EXPERTISE:
🏠 PROPERTY SPECIALIST:
- Master of all property details, amenities, and house rules
- Expert on WiFi, parking, check-in/out procedures, and emergency contacts
- Knowledgeable about cleaning supplies locations, trash procedures, and maintenance

🗺️ LOCAL AREA EXPERT:
- Deep knowledge of the surrounding neighborhood and attractions
- Current information about restaurants, cafes, shops, and entertainment
- Transportation options, walking distances, and navigation assistance
- Weather-appropriate activity suggestions and seasonal recommendations

📞 CONCIERGE SERVICES:
- Restaurant reservations and local business recommendations
- Event information and ticket purchasing guidance
- Emergency services and medical facility locations
- Shopping centers, grocery stores, and essential services

YOUR COMMUNICATION STYLE:
- Professional yet warm and welcoming
- Clear, actionable, and specific in your responses
- Proactive in suggesting helpful information
- Use appropriate emojis for clarity and warmth
- Always prioritize guest safety and comfort

${propertyInfo}

${locationContext}

PROPERTY KNOWLEDGE BASE:
${kbContext}

CORE GUIDELINES:

✅ ALWAYS PROVIDE:
- Specific addresses, distances, and walking times when possible
- Business hours and contact information for recommendations
- Alternative options (budget, luxury, dietary restrictions)
- Safety tips and local customs when relevant

✅ FOR WIFI QUESTIONS: Provide network name and password from property info, plus troubleshooting if needed

✅ FOR LOCATION QUESTIONS: Use your knowledge of ${property?.location || 'the area'} to provide current, specific recommendations

✅ FOR CHECK-IN/OUT: Reference property-specific instructions and video if available

✅ FOR EMERGENCIES: Provide immediate helpful information and suggest contacting host or emergency services

✅ FOR CLEANING/SUPPLIES: Give specific locations within the property

⚠️ WHEN INFORMATION IS UNAVAILABLE:
- Offer to have the host contact them directly
- Provide general helpful alternatives
- Never make up specific details like addresses or phone numbers

Remember: You're here to make their stay exceptional through knowledgeable, professional assistance.`

    console.log('Making AI request for guest assistance')
    
    // Prepare messages for guest AI providers
    const messages: GuestAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]
    
    // Use guest-specific AI provider system with fallback
    const aiResponse = await generateGuestAIResponse(messages, {
      maxTokens: 400,
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      model: 'gpt-4o-mini'
    })
    
    console.log(`✅ Guest assistance response from ${aiResponse.provider} (${aiResponse.model})`)
    const response = aiResponse.content

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in guest chat API:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    
    // Professional guest assistance fallback
    const fallbackResponse = getGuestFallbackResponse(message || '')
    
    console.log('Using professional guest assistance fallback:', fallbackResponse)
    
    return NextResponse.json({ 
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true
    })
  }
}

