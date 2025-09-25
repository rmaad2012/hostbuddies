// Force Node.js runtime for environment variables
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { recommendations, propertyName } = await request.json()

    // If no API key, fall back to mock response
    if (!process.env.OPENAI_API_KEY) {
      return getMockResponse(recommendations, propertyName)
    }

    // Create AI-powered itinerary using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert local travel guide and hospitality consultant. You help Airbnb hosts create personalized, guest-friendly itineraries from their local knowledge. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Create a personalized ${recommendations.duration} itinerary for guests staying at "${propertyName}".\n\nLocal recommendations from the host:\n- Restaurants: ${recommendations.restaurants || 'Not specified'}\n- Attractions: ${recommendations.attractions || 'Not specified'}\n- Activities: ${recommendations.activities || 'Not specified'}\n- Local Tips: ${recommendations.localTips || 'Not specified'}\n- Target Audience: ${recommendations.targetAudience}\n\nReturn JSON in this exact shape:\n{\n  "name": "Itinerary title",\n  "description": "Short overview",\n  "activities": [\n    { "description": "text", "location": "place", "duration": 60 }\n  ]\n}\n\nRules:\n- 3 activities for half-day, 5 for full-day, 6 for weekend.\n- duration is in minutes (30-180).\n- Use provided places when possible.\n- Tailor tone to the target audience.\n- Prefer authentic, local experiences.`
        }
      ],
      temperature: 0.8,
      max_tokens: 1200
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const aiResponse = JSON.parse(content)

    if (!aiResponse || !Array.isArray(aiResponse.activities)) {
      throw new Error('Invalid AI response')
    }

    return NextResponse.json(aiResponse)
  } catch (error) {
    console.error('Error generating AI itinerary:', error)
    // Fallback to mock response if AI fails
    try {
      const { recommendations, propertyName } = await request.json()
      return getMockResponse(recommendations, propertyName)
    } catch (_) {
      return NextResponse.json(
        { error: 'Failed to generate itinerary' },
        { status: 500 }
      )
    }
  }
}

// Mock response used when OpenAI is unavailable
function getMockResponse(recommendations: any, propertyName: string) {
  const aiResponse = {
    name: `${propertyName} Local Discovery Experience`,
    description:
      `A curated exploration of the best local spots around ${propertyName}, featuring handpicked restaurants, attractions, and hidden gems.`,
    activities: [
      {
        description:
          (recommendations?.restaurants
            ? `Start your day with a visit to: ${recommendations.restaurants.split(',')[0]?.trim() || 'a cozy local cafe'}.`
            : 'Begin with breakfast at a charming local cafe.'),
        location: 'Local breakfast spot',
        duration: 60
      },
      {
        description:
          (recommendations?.attractions
            ? `Explore: ${recommendations.attractions.split(',')[0]?.trim() || 'local museums and landmarks'}.`
            : "Discover the area's rich history and culture."),
        location: 'Historic district',
        duration: 90
      },
      {
        description:
          (recommendations?.activities
            ? `Enjoy: ${recommendations.activities.split(',')[0]?.trim() || 'authentic local experiences'}.`
            : 'Engage in authentic local experiences.'),
        location: 'Activity center',
        duration: 120
      },
      {
        description:
          (recommendations?.localTips
            ? `Uncover local secrets: ${recommendations.localTips.split(',')[0]?.trim() || 'hidden gems'}.`
            : 'Find the hidden treasures that locals love.'),
        location: 'Hidden gem location',
        duration: 75
      },
      {
        description:
          (recommendations?.restaurants
            ? `Dine at: ${recommendations.restaurants.split(',').slice(-1)[0]?.trim() || 'a recommended local restaurant'}.`
            : 'Savor the local cuisine to cap off your day.'),
        location: 'Restaurant district',
        duration: 90
      }
    ]
  }

  // Tailor based on audience
  if (recommendations?.targetAudience === 'families') {
    aiResponse.activities = aiResponse.activities.map(a => ({
      ...a,
      description: a.description + ' Family-friendly options available.'
    }))
  } else if (recommendations?.targetAudience === 'couples') {
    aiResponse.activities = aiResponse.activities.map(a => ({
      ...a,
      description: a.description + ' Great for a romantic experience.'
    }))
  } else if (recommendations?.targetAudience === 'adventure') {
    aiResponse.activities = aiResponse.activities.map(a => ({
      ...a,
      description: a.description + ' Adventure-forward and exciting.'
    }))
  }

  // Adjust for duration
  if (recommendations?.duration === 'half-day') {
    aiResponse.activities = aiResponse.activities.slice(0, 3)
  } else if (recommendations?.duration === 'weekend') {
    aiResponse.activities = [
      ...aiResponse.activities,
      {
        description:
          'Extended exploration with additional time for relaxation and deeper discovery.',
        location: 'Multiple locations',
        duration: 180
      }
    ]
  }

  return NextResponse.json(aiResponse)
}
