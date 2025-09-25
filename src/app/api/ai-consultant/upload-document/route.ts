import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { processPDFDocument } from '@/lib/enhanced-ai-consultant-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sessionId = formData.get('sessionId') as string

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'Missing file or sessionId' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process the PDF document
    const documentId = await processPDFDocument(
      buffer,
      file.name,
      sessionId,
      user.id,
      supabase
    )

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document processed successfully'
    })

  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle text document uploads
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, documentName, textContent } = await request.json()

    if (!sessionId || !documentName || !textContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create document record
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate AI summary
    const { generateAIResponse } = await import('@/lib/ai-providers')
    
    const summaryMessages = [
      {
        role: 'system' as const,
        content: `You are analyzing a text document uploaded to an Airbnb optimization platform. 
        Summarize the key insights, strategies, tips, or data that would be relevant for 
        improving Airbnb listings, pricing, or guest experiences. Focus on actionable insights.`
      },
      {
        role: 'user' as const,
        content: `Please summarize this document for Airbnb optimization context:\n\n${textContent.substring(0, 4000)}`
      }
    ]

    const summaryResponse = await generateAIResponse(summaryMessages, {
      maxTokens: 500,
      temperature: 0.3
    })

    // Store document
    await supabase
      .from('knowledge_base_documents')
      .insert({
        id: documentId,
        user_id: user.id,
        session_id: sessionId,
        document_name: documentName,
        document_type: 'text',
        content_text: textContent,
        content_summary: summaryResponse.content,
        processing_status: 'completed',
        metadata: { content_length: textContent.length }
      })

    // Store in memory
    await supabase
      .from('ai_consultant_memory')
      .insert({
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        memory_type: 'knowledge_base_document',
        content: {
          document_id: documentId,
          document_name: documentName,
          summary: summaryResponse.content,
          key_insights: textContent.substring(0, 1000)
        },
        importance_score: 8
      })

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Text document processed successfully'
    })

  } catch (error) {
    console.error('Error processing text document:', error)
    return NextResponse.json({
      error: 'Failed to process text document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
