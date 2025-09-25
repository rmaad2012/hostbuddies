import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider
      } : null,
      error: error?.message
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user' })
  }
}
