// Enhanced Web Scraper for Airbnb Listings
// This provides multiple scraping strategies with better data extraction

interface ScrapedData {
  title: string;
  description: string | null;
  price: string | null;
  amenities: string[] | null;
  location: string | null;
  photos: string[] | null;
  reviews: { rating: number; count: number } | null;
  hostInfo: { name: string; responseRate: string; responseTime: string } | null;
  bedrooms?: number;
  bathrooms?: number;
  guests?: number;
  propertyType?: string;
}

export class EnhancedAirbnbScraper {
  private userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];

  async scrapeAirbnbListing(url: string): Promise<ScrapedData> {
    console.log(`🔍 Starting enhanced scraping for: ${url}`);
    
    // Try multiple scraping strategies
    const strategies = [
      () => this.scrapeDirect(url),
      () => this.scrapeWithDelay(url),
      () => this.scrapeMetaOnly(url)
    ];

    for (const [index, strategy] of strategies.entries()) {
      try {
        console.log(`📡 Trying scraping strategy ${index + 1}...`);
        const result = await strategy();
        if (this.isValidData(result)) {
          console.log(`✅ Strategy ${index + 1} successful!`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Strategy ${index + 1} failed:`, error);
        continue;
      }
    }

    // If all strategies fail, return basic fallback
    console.log('🔄 All strategies failed, returning fallback data');
    return this.getFallbackData(url);
  }

  private async scrapeDirect(url: string): Promise<ScrapedData> {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return this.parseHTML(html, url);
  }

  private async scrapeWithDelay(url: string): Promise<ScrapedData> {
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    return this.scrapeDirect(url);
  }

  private async scrapeMetaOnly(url: string): Promise<ScrapedData> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HostBuddies/1.0; +https://hostbuddies.com/bot)'
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await response.text();
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    return {
      title: this.extractMetaTitle($),
      description: this.extractMetaDescription($),
      price: this.extractBasicPrice($),
      amenities: this.extractBasicAmenities($),
      location: this.extractMetaLocation($),
      photos: this.extractMetaPhotos($),
      reviews: this.extractBasicReviews($),
      hostInfo: null
    };
  }

  private async parseHTML(html: string, url: string): Promise<ScrapedData> {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    // Extract JSON-LD data if available
    const jsonLdData = this.extractJsonLd($);
    
    return {
      title: this.extractTitle($, jsonLdData),
      description: this.extractDescription($, jsonLdData),
      price: this.extractPrice($, jsonLdData),
      amenities: this.extractAmenities($, jsonLdData),
      location: this.extractLocation($, jsonLdData),
      photos: this.extractPhotos($, jsonLdData),
      reviews: this.extractReviews($, jsonLdData),
      hostInfo: this.extractHostInfo($, jsonLdData),
      bedrooms: this.extractBedrooms($, jsonLdData),
      bathrooms: this.extractBathrooms($, jsonLdData),
      guests: this.extractGuests($, jsonLdData),
      propertyType: this.extractPropertyType($, jsonLdData)
    };
  }

  private extractJsonLd($: any): any {
    try {
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts.eq(i);
        const content = script.html();
        if (content) {
          const data = JSON.parse(content);
          if (data['@type'] === 'Product' || data['@type'] === 'Place') {
            return data;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error);
    }
    return null;
  }

  private extractTitle($: any, jsonLd?: any): string {
    // Try JSON-LD first
    if (jsonLd?.name) return jsonLd.name;

    // Try multiple selectors
    const selectors = [
      'h1[data-testid="listing-title"]',
      'h1._fecoyn4',
      'h1[data-plugin-in-point-id="TITLE_DEFAULT"]',
      'h1._1qfpqnv',
      'h1[class*="title"]',
      'h1',
      'meta[property="og:title"]',
      'title'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = selector.includes('meta') 
          ? element.attr('content') 
          : element.first().text().trim();
        if (text && text.length > 5) {
          return text;
        }
      }
    }

    return 'Title not available';
  }

  private extractDescription($: any, jsonLd?: any): string | null {
    // Try JSON-LD first
    if (jsonLd?.description) return jsonLd.description;

    const selectors = [
      '[data-testid="listing-description"] span',
      '._1ksrwu6',
      '[data-plugin-in-point-id="DESCRIPTION_DEFAULT"]',
      'meta[property="og:description"]',
      'meta[name="description"]'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = selector.includes('meta') 
          ? element.attr('content') 
          : element.first().text().trim();
        if (text && text.length > 10) {
          return text;
        }
      }
    }

    return null;
  }

  private extractPrice($: any, jsonLd?: any): string | null {
    // Try JSON-LD first
    if (jsonLd?.offers?.price) return `$${jsonLd.offers.price}`;

    const selectors = [
      '[data-testid="price-availability-row"] span',
      '._1y74zjx',
      '[data-plugin-in-point-id="PRICE_DEFAULT"]',
      '._1p7iugi',
      '[class*="price"]'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      for (let i = 0; i < elements.length; i++) {
        const text = elements.eq(i).text().trim();
        if (text.match(/\$\d+/)) {
          return text;
        }
      }
    }

    return null;
  }

  private extractAmenities($: any, jsonLd?: any): string[] | null {
    const amenities: string[] = [];

    // Try various amenity selectors
    const selectors = [
      '[data-testid="amenity-item"]',
      '[data-plugin-in-point-id="AMENITIES_DEFAULT"] div',
      '._1doqx8w div',
      '[class*="amenity"] span'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      elements.each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 2 && !amenities.includes(text)) {
          amenities.push(text);
        }
      });
    }

    return amenities.length > 0 ? amenities : null;
  }

  private extractLocation($: any, jsonLd?: any): string | null {
    // Try JSON-LD first
    if (jsonLd?.address?.addressLocality) {
      return `${jsonLd.address.addressLocality}, ${jsonLd.address.addressRegion || jsonLd.address.addressCountry}`;
    }

    const selectors = [
      '[data-testid="location-info"] span',
      '._9xiloll',
      '[data-plugin-in-point-id="LOCATION_DEFAULT"]',
      'meta[property="og:locality"]'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = selector.includes('meta') 
          ? element.attr('content') 
          : element.first().text().trim();
        if (text && text.length > 3) {
          return text;
        }
      }
    }

    return null;
  }

  private extractPhotos($: any, jsonLd?: any): string[] | null {
    const photos: string[] = [];

    // Try various photo selectors
    const selectors = [
      'img[data-testid="photo"]',
      '._6tbg2q img',
      '[data-plugin-in-point-id="PHOTOS_DEFAULT"] img',
      'img[src*="airbnb"]'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      elements.each((_, element) => {
        const src = $(element).attr('src');
        if (src && src.includes('http') && !photos.includes(src)) {
          photos.push(src);
        }
      });
    }

    return photos.length > 0 ? photos.slice(0, 10) : null; // Limit to 10 photos
  }

  private extractReviews($: any, jsonLd?: any): { rating: number; count: number } | null {
    // Try JSON-LD first
    if (jsonLd?.aggregateRating) {
      return {
        rating: parseFloat(jsonLd.aggregateRating.ratingValue) || 0,
        count: parseInt(jsonLd.aggregateRating.reviewCount) || 0
      };
    }

    const ratingSelectors = [
      '[data-testid="review-score-rating"] span',
      '._17p6nbba',
      '[aria-label*="rating"]'
    ];

    const countSelectors = [
      '[data-testid="review-score-count"] span',
      '._1f1oir5',
      '[aria-label*="review"]'
    ];

    let rating = 0;
    let count = 0;

    // Extract rating
    for (const selector of ratingSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.first().text().trim();
        const match = text.match(/(\d+\.?\d*)/);
        if (match) {
          rating = parseFloat(match[1]);
          break;
        }
      }
    }

    // Extract count
    for (const selector of countSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.first().text().trim();
        const match = text.match(/(\d+)/);
        if (match) {
          count = parseInt(match[1]);
          break;
        }
      }
    }

    return rating > 0 || count > 0 ? { rating, count } : null;
  }

  private extractHostInfo($: any, jsonLd?: any): { name: string; responseRate: string; responseTime: string } | null {
    const selectors = [
      '[data-testid="host-profile"] span',
      '._1foj6yps',
      '[data-plugin-in-point-id="HOST_PROFILE_DEFAULT"]'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.first().text().trim();
        if (text && text.length > 2) {
          return {
            name: text,
            responseRate: 'Not available',
            responseTime: 'Not available'
          };
        }
      }
    }

    return null;
  }

  private extractBedrooms($: any, jsonLd?: any): number {
    const text = $('body').text();
    const match = text.match(/(\d+)\s*bedroom/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractBathrooms($: any, jsonLd?: any): number {
    const text = $('body').text();
    const match = text.match(/(\d+)\s*bathroom/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractGuests($: any, jsonLd?: any): number {
    const text = $('body').text();
    const match = text.match(/(\d+)\s*guest/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractPropertyType($: any, jsonLd?: any): string {
    if (jsonLd?.['@type']) return jsonLd['@type'];
    
    const text = $('body').text().toLowerCase();
    const types = ['apartment', 'house', 'condo', 'villa', 'cabin', 'loft', 'studio'];
    
    for (const type of types) {
      if (text.includes(type)) {
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }
    
    return 'Property';
  }

  // Meta-only extraction methods
  private extractMetaTitle($: any): string {
    return $('meta[property="og:title"]').attr('content') || 
           $('meta[name="title"]').attr('content') || 
           $('title').text() || 
           'Title not available';
  }

  private extractMetaDescription($: any): string | null {
    return $('meta[property="og:description"]').attr('content') || 
           $('meta[name="description"]').attr('content') || 
           null;
  }

  private extractBasicPrice($: any): string | null {
    const text = $('body').text();
    const match = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/);
    return match ? match[0] : null;
  }

  private extractBasicAmenities($: any): string[] | null {
    // Look for common amenity keywords in the page text
    const text = $('body').text().toLowerCase();
    const commonAmenities = [
      'wifi', 'parking', 'kitchen', 'air conditioning', 'heating', 'washer', 'dryer',
      'pool', 'gym', 'hot tub', 'balcony', 'patio', 'fireplace', 'tv', 'netflix'
    ];
    
    const found = commonAmenities.filter(amenity => text.includes(amenity));
    return found.length > 0 ? found : null;
  }

  private extractMetaLocation($: any): string | null {
    return $('meta[property="og:locality"]').attr('content') || 
           $('meta[property="og:region"]').attr('content') || 
           null;
  }

  private extractMetaPhotos($: any): string[] | null {
    const photos: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) photos.push(ogImage);
    
    return photos.length > 0 ? photos : null;
  }

  private extractBasicReviews($: any): { rating: number; count: number } | null {
    const text = $('body').text();
    const ratingMatch = text.match(/(\d+\.?\d*)\s*(?:out of 5|\/5|\*)/i);
    const countMatch = text.match(/(\d+)\s*reviews?/i);
    
    if (ratingMatch || countMatch) {
      return {
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
        count: countMatch ? parseInt(countMatch[1]) : 0
      };
    }
    
    return null;
  }

  private isValidData(data: ScrapedData): boolean {
    return !!(data.title && 
             data.title !== 'Title not available' && 
             data.title.length > 5);
  }

  private getFallbackData(url: string): ScrapedData {
    return {
      title: 'Airbnb Listing Analysis',
      description: 'Unable to extract full details, but I can still provide competitive analysis based on the URL and general Airbnb best practices.',
      price: null,
      amenities: null,
      location: null,
      photos: null,
      reviews: null,
      hostInfo: null
    };
  }
}

// Export singleton instance
export const airbnbScraper = new EnhancedAirbnbScraper();
