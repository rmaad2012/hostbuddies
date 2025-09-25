import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export interface GuestAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GuestAIResponse {
  content: string
  provider: 'openai' | 'gemini' | 'fallback'
  model: string
}

// Convert messages to Gemini format
function convertMessagesToGemini(messages: GuestAIMessage[]): string {
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessage = messages.find(m => m.role === 'user')?.content || ''
  
  return `${systemMessage}\n\nGuest: ${userMessage}\n\nAssistant:`
}

// Guest-specific AI response generation
export async function generateGuestAIResponse(
  messages: GuestAIMessage[],
  options: {
    maxTokens?: number
    temperature?: number
    model?: string
  } = {}
): Promise<GuestAIResponse> {
  const { maxTokens = 400, temperature = 0.3, model = 'gpt-4o-mini' } = options

  // Try OpenAI first with multiple model fallbacks
  if (process.env.OPENAI_API_KEY) {
    // Try multiple OpenAI models in order of preference
    const openaiModels = [model, 'gpt-3.5-turbo', 'gpt-4o-mini']
    
    for (const currentModel of openaiModels) {
      try {
        console.log(`🏠 Attempting OpenAI request for guest assistance with ${currentModel}...`)
        const completion = await openai.chat.completions.create({
          model: currentModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          max_tokens: Math.min(maxTokens, 1000), // Limit tokens to avoid quota issues
          temperature,
          timeout: 8000, // 8 second timeout for guest queries
        })

        const content = completion.choices[0]?.message?.content
        if (content && content.trim().length > 10) {
          console.log(`✅ OpenAI guest assistance successful with ${currentModel}`)
          return {
            content: content.trim(),
            provider: 'openai',
            model: currentModel
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ OpenAI ${currentModel} failed for guest assistance:`, error.message)
        
        // If quota exceeded, skip to Gemini immediately
        if (error.status === 429 || error.code === 'insufficient_quota') {
          console.log('💡 OpenAI quota exceeded, skipping to Gemini for guest assistance...')
          break // Don't try other OpenAI models
        }
        
        // For other errors, try next model
        continue
      }
    }
  }

  // Try Gemini as fallback with current model names
  if (genAI && process.env.GEMINI_API_KEY) {
    // Working model names with correct prefix from API discovery
    const modelNames = [
      'models/gemini-2.0-flash',
      'models/gemini-1.5-flash', 
      'models/gemini-1.5-pro',
      'models/gemini-pro-latest'
    ]
    
    for (const modelName of modelNames) {
      try {
        console.log(`🚀 Attempting Gemini request for guest assistance with model: ${modelName}...`)
        const geminiModel = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature,
          }
        })
        
        const prompt = convertMessagesToGemini(messages)
        const result = await geminiModel.generateContent(prompt)
        const response = await result.response
        const content = response.text()

        if (content && content.trim().length > 10) {
          console.log(`✅ Gemini guest assistance successful with ${modelName}`)
          return {
            content: content.trim(),
            provider: 'gemini',
            model: modelName
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Gemini ${modelName} failed for guest assistance:`, error.message)
        // If it's a model not found error, try simpler model names
        if (error.message.includes('not found') || error.message.includes('404')) {
          try {
            console.log(`🔄 Trying simplified model name: gemini-pro...`)
            const fallbackModel = genAI.getGenerativeModel({ 
              model: 'gemini-pro',
              generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: temperature,
              }
            })
            
            const fallbackResult = await fallbackModel.generateContent(prompt)
            const fallbackResponse = await fallbackResult.response
            const fallbackContent = fallbackResponse.text()

            if (fallbackContent && fallbackContent.trim().length > 10) {
              console.log(`✅ Gemini fallback model successful`)
              return {
                content: fallbackContent.trim(),
                provider: 'gemini',
                model: 'gemini-pro'
              }
            }
          } catch (fallbackError: any) {
            console.warn(`⚠️ Gemini fallback also failed:`, fallbackError.message)
          }
        }
        continue
      }
    }
  }

  // Final fallback - throw error to trigger guest-specific fallback
  console.log('🏨 All AI services failed, triggering guest-specific fallback')
  throw new Error('AI services unavailable - use guest fallback')
}

// Professional guest fallback responses
export function getGuestFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // WiFi and internet questions
  if (lowerMessage.includes('wifi') || lowerMessage.includes('password') || lowerMessage.includes('internet')) {
    return '📶 **WiFi Information**\n\nThe WiFi network name and password should be available in your check-in instructions or on a card near the router. Common locations to check:\n\n• Welcome folder or guest book\n• Kitchen counter or coffee table\n• Near the TV or router\n• Refrigerator door\n\nIf you can\'t locate this information, I can contact your host for the details. Is there anything else I can help you with regarding internet connectivity?'
  }
  
  // Checkout procedures
  if (lowerMessage.includes('checkout') || lowerMessage.includes('check out') || lowerMessage.includes('leaving')) {
    return '🕑 **Check-out Information**\n\nStandard check-out time is typically 11:00 AM. Here\'s your checkout checklist:\n\n✅ Gather all personal belongings\n✅ Leave keys as instructed (lockbox, counter, etc.)\n✅ Ensure all windows and doors are locked\n✅ Turn off lights, AC/heating, and appliances\n✅ Take out trash if requested\n\nThank you for staying with us! We hope you had a wonderful experience. 🌆'
  }
  
  // Parking information
  if (lowerMessage.includes('park') || lowerMessage.includes('car') || lowerMessage.includes('vehicle')) {
    return '🚗 **Parking Information**\n\nParking options typically include:\n\n• **Street parking** - Check for time restrictions and parking signs\n• **Driveways** - If available, use designated guest spots only\n• **Parking garages** - Nearby paid options are usually available\n\nFor specific parking instructions for this property, please check your booking details or I can contact your host for clarification.'
  }
  
  // Cleaning supplies
  if (lowerMessage.includes('clean') || lowerMessage.includes('supplies') || lowerMessage.includes('towel') || lowerMessage.includes('soap')) {
    return '🧹 **Cleaning Supplies & Essentials**\n\nCleaning supplies are typically located in:\n\n• **Under kitchen sink** - Most common location\n• **Utility closet** - Check near laundry area\n• **Bathroom cabinets** - Basic supplies\n• **Pantry or storage room**\n\nExtra towels and linens are usually in:\n• Linen closet\n• Bedroom closets\n• Bathroom cabinets\n\nLet me know what specific items you\'re looking for!'
  }
  
  // Local recommendations
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('coffee')) {
    return '🍽️ **Local Dining Recommendations**\n\nFor the best local dining experience, I recommend:\n\n• **Coffee shops** - Usually within 2-3 blocks of most properties\n• **Restaurants** - Check Google Maps or Yelp for highly-rated nearby options\n• **Grocery stores** - For essentials and cooking at the property\n\nI can provide more specific recommendations if you let me know:\n• What type of cuisine you prefer\n• Your budget range\n• Walking distance preference\n\nWhat sounds good to you?'
  }
  
  // Attractions and activities
  if (lowerMessage.includes('do') || lowerMessage.includes('see') || lowerMessage.includes('visit') || lowerMessage.includes('attraction')) {
    return '🗺️ **Local Attractions & Activities**\n\nHere are some great ways to explore the area:\n\n🌆 **Popular attractions** - Museums, landmarks, scenic viewpoints\n🏃‍♂️ **Outdoor activities** - Parks, hiking trails, waterfront areas\n🎭 **Entertainment** - Theaters, live music venues, local events\n🛍️ **Shopping** - Local markets, boutiques, shopping centers\n\nFor personalized recommendations based on your interests and the current weather, just let me know what you enjoy doing!'
  }
  
  // Emergency or urgent help
  if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('urgent') || lowerMessage.includes('problem')) {
    return '🆘 **Need Assistance?**\n\nI\'m here to help! For:\n\n🚑 **True emergencies** - Call 911 immediately\n🏥 **Medical needs** - Nearest urgent care or hospital\n🔧 **Property issues** - I can contact your host right away\n📞 **General help** - Happy to assist with any questions\n\nPlease let me know what specific assistance you need, and I\'ll provide the best guidance possible!'
  }
  
  // General fallback
  return '👋 **I\'m Here to Help!**\n\nI\'m your personal guest assistant, ready to help with:\n\n• 📶 WiFi passwords and connectivity\n• 🗺️ Local recommendations and directions\n• 🏠 Property information and house rules\n• 🍽️ Restaurant and activity suggestions\n• 🚗 Parking and transportation info\n• 🧹 Cleaning supplies and essentials\n\nWhat can I assist you with today? Feel free to ask me anything about your stay!'
}
