# Enhanced AI Consultant Features

## Overview

The Enhanced AI Consultant for HostBuddies now includes three powerful capabilities:

1. **Enhanced Working Memory** - Persistent context across conversations
2. **Knowledge Base** - Upload and process PDF documents for insights
3. **Web Scraping** - Analyze competitor Airbnb listings from URLs

## Features Implemented

### 🧠 Enhanced Working Memory
- **Persistent Context**: AI remembers all previous conversations, recommendations, and insights
- **Contextual Responses**: References past discussions and uploaded content
- **Smart Importance Scoring**: Prioritizes important information for better context
- **Multi-session Memory**: Maintains context across different consultation sessions

### 📚 Knowledge Base System
- **PDF Processing**: Upload PDF documents (market reports, strategy guides, etc.)
- **Text Extraction**: Automatically extracts text from uploaded PDFs
- **AI Summarization**: Generates summaries of uploaded documents
- **Contextual Integration**: AI references uploaded documents in recommendations
- **Document Management**: Track processing status and manage uploaded files

### 🔍 Web Scraping Capabilities
- **Airbnb URL Analysis**: Scrape competitor listings from Airbnb URLs
- **Data Extraction**: Extract title, description, pricing, amenities, and location
- **Competitor Analysis**: AI compares your listing against scraped competitors
- **Caching System**: Avoids re-scraping recently analyzed URLs
- **Error Handling**: Graceful fallbacks when scraping fails

## API Endpoints

### Main AI Consultant
```
POST /api/ai-consultant
```
Enhanced with knowledge base and scraped listing context.

### Document Upload
```
POST /api/ai-consultant/upload-document
Content-Type: multipart/form-data

Body:
- file: PDF or text file
- sessionId: AI consultant session ID
```

### Text Document Upload
```
PUT /api/ai-consultant/upload-document
Content-Type: application/json

Body:
{
  "sessionId": "string",
  "documentName": "string", 
  "textContent": "string"
}
```

### Web Scraping
```
POST /api/ai-consultant/scrape-listing
Content-Type: application/json

Body:
{
  "url": "https://airbnb.com/rooms/...",
  "sessionId": "string"
}
```

### Get Scraped Data
```
GET /api/ai-consultant/scrape-listing?sessionId=xxx
GET /api/ai-consultant/scrape-listing?scrapedId=xxx
```

## Database Schema

### Enhanced Tables Added:

1. **knowledge_base_documents** - Stores uploaded documents and their processed content
2. **web_scraped_listings** - Stores scraped Airbnb listing data
3. **listing_analysis** - Stores AI-generated analysis and comparisons
4. **document_chunks** - For large document processing (future embeddings)

### Enhanced Memory Types:
- `knowledge_base_document` - References to uploaded documents
- `web_scraped_listing` - References to scraped competitor listings
- `competitor_analysis` - AI analysis of competitors
- `seasonal_insights` - Time-based recommendations

## Usage Examples

### 1. Basic Consultation with Memory
```javascript
// Start conversation
const response = await fetch('/api/ai-consultant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Can you audit my listing?",
    propertyId: "prop_123",
    sessionType: "listing_audit"
  })
})

// AI remembers this conversation in future requests
```

### 2. Upload Knowledge Base Document
```javascript
const formData = new FormData()
formData.append('file', pdfFile)
formData.append('sessionId', sessionId)

const response = await fetch('/api/ai-consultant/upload-document', {
  method: 'POST',
  body: formData
})

// AI can now reference this document in responses
```

### 3. Scrape Competitor Listing
```javascript
const response = await fetch('/api/ai-consultant/scrape-listing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: "https://airbnb.com/rooms/12345",
    sessionId: sessionId
  })
})

// AI can now compare your listing against this competitor
```

### 4. Enhanced Consultation with All Context
```javascript
// After uploading documents and scraping competitors
const response = await fetch('/api/ai-consultant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Based on the uploaded market report and competitor analysis, how should I optimize my pricing?",
    propertyId: "prop_123",
    sessionId: sessionId
  })
})

// AI responds with insights from:
// - Uploaded documents
// - Scraped competitor data  
// - Previous conversation history
// - Market data
```

## React Component

Use the `EnhancedAIConsultant` component:

```jsx
import EnhancedAIConsultant from '@/components/dashboard/EnhancedAIConsultant'

function ConsultantPage() {
  return (
    <EnhancedAIConsultant 
      propertyId="prop_123"
      sessionId="session_456" // optional
    />
  )
}
```

## Key Benefits

### For Users:
- **Persistent Memory**: AI remembers all interactions and recommendations
- **Rich Context**: Upload industry reports, strategy guides, competitor analysis
- **Competitive Intelligence**: Analyze competitor listings automatically
- **Personalized Advice**: Recommendations based on your specific documents and data

### For AI Quality:
- **Better Context**: More relevant and specific recommendations
- **Data-Driven**: Uses actual competitor data and industry documents
- **Consistent**: Maintains context across sessions
- **Learning**: Builds knowledge base over time

## Technical Implementation

### Memory System:
- Enhanced memory storage with importance scoring
- Context building from multiple data sources
- Smart retrieval of relevant information

### Document Processing:
- PDF text extraction using `pdf-parse`
- AI summarization for quick reference
- Chunked storage for large documents

### Web Scraping:
- Cheerio-based HTML parsing
- Fallback to meta tag extraction
- Caching to avoid duplicate scraping
- Error handling for anti-scraping measures

## Migration Required

Run the database migration to set up the new tables:

```bash
# Apply the migration (this creates the new tables)
# The migration file is: 20241226000000_enhanced_ai_consultant.sql
```

## Environment Variables

No additional environment variables required. Uses existing:
- `OPENAI_API_KEY` (optional)
- `GEMINI_API_KEY` (required)
- Supabase credentials

## Limitations & Notes

1. **Web Scraping**: Airbnb has anti-scraping measures. The implementation includes fallbacks but may not capture all data.

2. **File Size**: PDF uploads limited to 10MB

3. **Caching**: Scraped listings cached for 24 hours to avoid excessive requests

4. **Processing**: Large documents may take time to process

5. **Memory**: System stores conversation history indefinitely (consider cleanup policies)

## Future Enhancements

- **Embeddings**: Add vector embeddings for semantic document search
- **Advanced Scraping**: Use Puppeteer for JavaScript-heavy pages  
- **Document Types**: Support more file formats (Word, Excel, etc.)
- **Batch Processing**: Upload multiple documents at once
- **Analytics**: Track which insights are most valuable
