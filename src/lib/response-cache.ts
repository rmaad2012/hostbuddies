// Simple in-memory response cache to improve AI consultant performance
interface CacheEntry {
  response: string
  timestamp: number
  provider: string
  model: string
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>()
  private maxAge = 5 * 60 * 1000 // 5 minutes
  private maxSize = 100 // Maximum cache entries

  private generateKey(message: string, systemPrompt: string): string {
    // Create a hash-like key from the message and system prompt
    const content = `${message}|${systemPrompt}`.toLowerCase()
    return Buffer.from(content).toString('base64').slice(0, 32)
  }

  get(message: string, systemPrompt: string): CacheEntry | null {
    const key = this.generateKey(message, systemPrompt)
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    console.log('🚀 Cache hit - returning cached response')
    return entry
  }

  set(message: string, systemPrompt: string, response: string, provider: string, model: string): void {
    const key = this.generateKey(message, systemPrompt)
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      provider,
      model
    })

    console.log(`💾 Response cached (${this.cache.size}/${this.maxSize} entries)`)
  }

  clear(): void {
    this.cache.clear()
    console.log('🗑️ Response cache cleared')
  }

  getStats(): { size: number; maxSize: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge
    }
  }
}

// Export singleton instance
export const responseCache = new ResponseCache()
