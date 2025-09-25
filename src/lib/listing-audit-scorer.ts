// Airbnb Listing Audit Scoring System
export interface ListingScore {
  overall: number // 0-100
  breakdown: {
    title: { score: number; feedback: string }
    description: { score: number; feedback: string }
    pricing: { score: number; feedback: string }
    amenities: { score: number; feedback: string }
    photos: { score: number; feedback: string }
    revenue_potential: { score: number; feedback: string }
  }
  improvements: string[]
  revenue_increase_potential: string
}

export function calculateListingScore(scrapedData: any): ListingScore {
  const scores = {
    title: scoreTitleOptimization(scrapedData.title),
    description: scoreDescription(scrapedData.description),
    pricing: scorePricing(scrapedData.price),
    amenities: scoreAmenities(scrapedData.amenities),
    photos: scorePhotos(scrapedData.photos),
    revenue_potential: scoreRevenuePotential(scrapedData)
  }

  // Calculate weighted overall score
  const weights = {
    title: 0.20,      // 20% - Critical for bookings
    description: 0.15, // 15% - Important for conversion
    pricing: 0.25,     // 25% - Major revenue factor
    amenities: 0.20,   // 20% - Differentiation factor
    photos: 0.10,      // 10% - Visual appeal
    revenue_potential: 0.10 // 10% - Growth opportunities
  }

  const overall = Math.round(
    scores.title.score * weights.title +
    scores.description.score * weights.description +
    scores.pricing.score * weights.pricing +
    scores.amenities.score * weights.amenities +
    scores.photos.score * weights.photos +
    scores.revenue_potential.score * weights.revenue_potential
  )

  // Generate improvement priorities
  const improvements = generateImprovements(scores)
  const revenueIncrease = estimateRevenueIncrease(overall, scores)

  return {
    overall,
    breakdown: scores,
    improvements,
    revenue_increase_potential: revenueIncrease
  }
}

function scoreTitleOptimization(title: string): { score: number; feedback: string } {
  if (!title) return { score: 0, feedback: "No title found" }

  let score = 50 // Base score
  const feedback: string[] = []

  // Length optimization (30-50 characters ideal)
  if (title.length < 20) {
    feedback.push("Title too short - add descriptive words")
    score -= 15
  } else if (title.length > 60) {
    feedback.push("Title too long - may get truncated")
    score -= 10
  } else if (title.length >= 30 && title.length <= 50) {
    score += 15
    feedback.push("Good title length")
  }

  // Power words check
  const powerWords = ['luxury', 'cozy', 'stunning', 'perfect', 'beautiful', 'amazing', 'unique', 'charming']
  const hasPowerWords = powerWords.some(word => title.toLowerCase().includes(word))
  if (hasPowerWords) {
    score += 10
    feedback.push("Contains engaging power words")
  } else {
    feedback.push("Add power words for emotional appeal")
  }

  // Location specificity
  if (title.match(/\b(downtown|beach|mountain|city center|historic|waterfront)\b/i)) {
    score += 10
    feedback.push("Good location specificity")
  } else {
    feedback.push("Add specific location descriptors")
  }

  // Property type clarity
  if (title.match(/\b(apartment|house|condo|villa|loft|studio|cabin)\b/i)) {
    score += 5
    feedback.push("Clear property type")
  } else {
    feedback.push("Clarify property type in title")
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: feedback.join("; ")
  }
}

function scoreDescription(description: string): { score: number; feedback: string } {
  if (!description) return { score: 0, feedback: "No description found" }

  let score = 40 // Base score
  const feedback: string[] = []

  // Length check (300-600 words ideal)
  const wordCount = description.split(/\s+/).length
  if (wordCount < 100) {
    feedback.push("Description too short - add more details")
    score -= 20
  } else if (wordCount > 800) {
    feedback.push("Description too long - may lose reader interest")
    score -= 10
  } else if (wordCount >= 300 && wordCount <= 600) {
    score += 20
    feedback.push("Good description length")
  }

  // Emotional appeal
  const emotionalWords = ['relax', 'enjoy', 'experience', 'memorable', 'peaceful', 'exciting', 'comfort']
  const hasEmotionalWords = emotionalWords.some(word => description.toLowerCase().includes(word))
  if (hasEmotionalWords) {
    score += 15
    feedback.push("Good emotional appeal")
  } else {
    feedback.push("Add emotional triggers and benefits")
  }

  // Local attractions mention
  if (description.match(/\b(restaurant|attraction|walk|minute|nearby|close)\b/i)) {
    score += 10
    feedback.push("Mentions local attractions")
  } else {
    feedback.push("Add nearby attractions and conveniences")
  }

  // Amenity highlights
  if (description.match(/\b(wifi|kitchen|parking|pool|gym|balcony)\b/i)) {
    score += 10
    feedback.push("Highlights key amenities")
  } else {
    feedback.push("Better highlight key amenities")
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: feedback.join("; ")
  }
}

function scorePricing(price: string): { score: number; feedback: string } {
  if (!price) return { score: 50, feedback: "Price analysis requires market data" }

  // This would need market data integration for accurate scoring
  // For now, provide general feedback
  return {
    score: 75,
    feedback: "Pricing analysis requires local market comparison data"
  }
}

function scoreAmenities(amenities: string[]): { score: number; feedback: string } {
  if (!amenities || amenities.length === 0) {
    return { score: 20, feedback: "No amenities listed - major missed opportunity" }
  }

  let score = 30 // Base score
  const feedback: string[] = []

  // High-value amenities check
  const highValueAmenities = [
    'wifi', 'kitchen', 'parking', 'pool', 'hot tub', 'gym', 'balcony', 
    'washer', 'dryer', 'air conditioning', 'heating', 'workspace'
  ]

  const hasHighValue = amenities.some(amenity => 
    highValueAmenities.some(hv => amenity.toLowerCase().includes(hv))
  )

  if (hasHighValue) {
    score += 25
    feedback.push("Has high-value amenities")
  } else {
    feedback.push("Missing key high-value amenities")
  }

  // Quantity bonus
  if (amenities.length >= 15) {
    score += 20
    feedback.push("Comprehensive amenity list")
  } else if (amenities.length >= 10) {
    score += 10
    feedback.push("Good amenity coverage")
  } else {
    feedback.push("Add more amenities to increase appeal")
  }

  // Unique amenities
  const uniqueAmenities = ['hot tub', 'pool', 'game room', 'fireplace', 'piano', 'gym']
  const hasUnique = amenities.some(amenity =>
    uniqueAmenities.some(ua => amenity.toLowerCase().includes(ua))
  )

  if (hasUnique) {
    score += 15
    feedback.push("Has unique differentiating amenities")
  } else {
    feedback.push("Consider adding unique amenities for differentiation")
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: feedback.join("; ")
  }
}

function scorePhotos(photos: string[]): { score: number; feedback: string } {
  if (!photos || photos.length === 0) {
    return { score: 10, feedback: "No photos found - critical issue" }
  }

  let score = 40 // Base score
  const feedback: string[] = []

  // Photo quantity
  if (photos.length >= 20) {
    score += 30
    feedback.push("Excellent photo coverage")
  } else if (photos.length >= 10) {
    score += 20
    feedback.push("Good photo quantity")
  } else if (photos.length >= 5) {
    score += 10
    feedback.push("Adequate photos but could add more")
  } else {
    feedback.push("Need significantly more photos")
  }

  // Quality indicators (basic heuristics)
  score += 20 // Assume decent quality since we can't analyze image content
  feedback.push("Photo quality analysis requires visual inspection")

  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: feedback.join("; ")
  }
}

function scoreRevenuePotential(scrapedData: any): { score: number; feedback: string } {
  let score = 60 // Base score
  const feedback: string[] = []

  // Revenue opportunity indicators
  const opportunities = []

  // Check for upsell mentions
  if (!scrapedData.description?.toLowerCase().includes('breakfast')) {
    opportunities.push("breakfast service")
  }
  if (!scrapedData.description?.toLowerCase().includes('cleaning')) {
    opportunities.push("cleaning service")
  }
  if (!scrapedData.amenities?.some((a: string) => a.toLowerCase().includes('parking'))) {
    opportunities.push("parking monetization")
  }

  if (opportunities.length > 0) {
    score += 15
    feedback.push(`Revenue opportunities: ${opportunities.join(', ')}`)
  }

  // Location-based opportunities
  if (scrapedData.location?.toLowerCase().includes('beach')) {
    score += 10
    feedback.push("Beach location - high revenue potential for experiences/equipment")
  }
  if (scrapedData.location?.toLowerCase().includes('downtown')) {
    score += 10
    feedback.push("Urban location - good for business travelers and premium pricing")
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: feedback.join("; ")
  }
}

function generateImprovements(scores: any): string[] {
  const improvements: string[] = []

  // Priority improvements based on lowest scores
  const sortedScores = Object.entries(scores)
    .map(([key, value]: [string, any]) => ({ area: key, score: value.score, feedback: value.feedback }))
    .sort((a, b) => a.score - b.score)

  sortedScores.slice(0, 3).forEach(item => {
    improvements.push(`${item.area.replace('_', ' ').toUpperCase()}: ${item.feedback}`)
  })

  return improvements
}

function estimateRevenueIncrease(overall: number, scores: any): string {
  if (overall >= 90) return "5-15% revenue increase potential"
  if (overall >= 80) return "15-25% revenue increase potential"
  if (overall >= 70) return "25-40% revenue increase potential"
  if (overall >= 60) return "40-60% revenue increase potential"
  if (overall >= 50) return "60-100% revenue increase potential"
  return "100%+ revenue increase potential with comprehensive optimization"
}
