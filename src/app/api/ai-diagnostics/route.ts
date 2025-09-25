import { NextRequest, NextResponse } from 'next/server'
import { runAIHealthCheck, getServiceSummary } from '@/lib/ai-diagnostics'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 AI diagnostics endpoint called')
    
    // Run comprehensive health check
    const healthCheck = await runAIHealthCheck()
    
    // Get human-readable summary
    const summary = getServiceSummary(healthCheck)
    
    return NextResponse.json({
      success: true,
      healthCheck,
      summary,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in AI diagnostics:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for now, but could be extended for specific tests
  return GET(request)
}
