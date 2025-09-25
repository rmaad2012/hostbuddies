// AI Service Diagnostics and Health Check
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIServiceStatus {
  service: 'openai' | 'gemini'
  status: 'working' | 'quota_exceeded' | 'invalid_key' | 'model_not_found' | 'network_error' | 'unknown_error'
  model?: string
  error?: string
  responseTime?: number
}

export interface AIHealthCheck {
  timestamp: string
  openai: AIServiceStatus
  gemini: AIServiceStatus
  recommendedService: 'openai' | 'gemini' | 'fallback'
}

// Test OpenAI service
async function testOpenAI(): Promise<AIServiceStatus> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      service: 'openai',
      status: 'invalid_key',
      error: 'No API key configured'
    }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const startTime = Date.now()
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test message' }],
      max_tokens: 10,
      timeout: 5000
    })

    const responseTime = Date.now() - startTime
    
    if (completion.choices[0]?.message?.content) {
      return {
        service: 'openai',
        status: 'working',
        model: 'gpt-3.5-turbo',
        responseTime
      }
    } else {
      return {
        service: 'openai',
        status: 'unknown_error',
        error: 'No response content'
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    if (error.status === 429 || error.code === 'insufficient_quota') {
      return {
        service: 'openai',
        status: 'quota_exceeded',
        error: 'API quota exceeded',
        responseTime
      }
    } else if (error.status === 401) {
      return {
        service: 'openai',
        status: 'invalid_key',
        error: 'Invalid API key',
        responseTime
      }
    } else if (error.status === 404) {
      return {
        service: 'openai',
        status: 'model_not_found',
        error: 'Model not found',
        responseTime
      }
    } else {
      return {
        service: 'openai',
        status: 'network_error',
        error: error.message,
        responseTime
      }
    }
  }
}

// Test Gemini service
async function testGemini(): Promise<AIServiceStatus> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      service: 'gemini',
      status: 'invalid_key',
      error: 'No API key configured'
    }
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const startTime = Date.now()
  
  // Try different model names with correct prefix
  const modelsToTry = ['models/gemini-2.0-flash', 'models/gemini-1.5-flash', 'models/gemini-pro-latest']
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent('Test message')
      const response = await result.response
      const content = response.text()
      
      const responseTime = Date.now() - startTime
      
      if (content && content.trim().length > 0) {
        return {
          service: 'gemini',
          status: 'working',
          model: modelName,
          responseTime
        }
      }
    } catch (error: any) {
      console.log(`Gemini model ${modelName} failed:`, error.message)
      continue // Try next model
    }
  }
  
  // If all models failed
  const responseTime = Date.now() - startTime
  return {
    service: 'gemini',
    status: 'model_not_found',
    error: 'All models failed or not found',
    responseTime
  }
}

// Run comprehensive health check
export async function runAIHealthCheck(): Promise<AIHealthCheck> {
  console.log('🔍 Running AI services health check...')
  
  const [openaiStatus, geminiStatus] = await Promise.all([
    testOpenAI(),
    testGemini()
  ])
  
  // Determine recommended service
  let recommendedService: 'openai' | 'gemini' | 'fallback'
  
  if (openaiStatus.status === 'working') {
    recommendedService = 'openai'
  } else if (geminiStatus.status === 'working') {
    recommendedService = 'gemini'
  } else {
    recommendedService = 'fallback'
  }
  
  const healthCheck: AIHealthCheck = {
    timestamp: new Date().toISOString(),
    openai: openaiStatus,
    gemini: geminiStatus,
    recommendedService
  }
  
  console.log('🏥 Health check results:', {
    openai: `${openaiStatus.status} (${openaiStatus.responseTime}ms)`,
    gemini: `${geminiStatus.status} (${geminiStatus.responseTime}ms)`,
    recommended: recommendedService
  })
  
  return healthCheck
}

// Get service status summary
export function getServiceSummary(healthCheck: AIHealthCheck): string {
  const { openai, gemini, recommendedService } = healthCheck
  
  let summary = '🤖 **AI Services Status**\n\n'
  
  // OpenAI status
  if (openai.status === 'working') {
    summary += `✅ **OpenAI**: Working (${openai.model}, ${openai.responseTime}ms)\n`
  } else if (openai.status === 'quota_exceeded') {
    summary += `⚠️ **OpenAI**: Quota exceeded - upgrade plan or wait for reset\n`
  } else if (openai.status === 'invalid_key') {
    summary += `❌ **OpenAI**: Invalid API key\n`
  } else {
    summary += `❌ **OpenAI**: ${openai.error}\n`
  }
  
  // Gemini status
  if (gemini.status === 'working') {
    summary += `✅ **Gemini**: Working (${gemini.model}, ${gemini.responseTime}ms)\n`
  } else if (gemini.status === 'model_not_found') {
    summary += `⚠️ **Gemini**: Models not accessible - check API key permissions\n`
  } else if (gemini.status === 'invalid_key') {
    summary += `❌ **Gemini**: Invalid API key\n`
  } else {
    summary += `❌ **Gemini**: ${gemini.error}\n`
  }
  
  summary += `\n🎯 **Recommended**: Using ${recommendedService === 'fallback' ? 'intelligent fallback responses' : recommendedService.toUpperCase()}\n`
  
  if (recommendedService === 'fallback') {
    summary += '\n💡 **Note**: All AI services are currently unavailable, but the chatbot will still provide helpful responses using our intelligent fallback system.'
  }
  
  return summary
}
