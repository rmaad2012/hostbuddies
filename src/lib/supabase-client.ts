import { createBrowserClient } from '@supabase/ssr'

// Browser client for client components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}


// Database types
export interface Property {
  id: string
  user_id: string
  name: string
  guidebook_url?: string
  guidebook_content?: string
  check_in_instructions?: string
  wifi_name?: string
  wifi_password?: string
  trash_day?: string
  quiet_hours?: string
  persona_style: 'friendly_guide' | 'foodie_pal' | 'trail_ranger'
  qr_code_url?: string
  status: 'draft' | 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface ScavengerHunt {
  id: string
  property_id: string
  user_id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface HuntClue {
  id: string
  hunt_id: string
  order_index: number
  clue_text: string
  reference_image_url?: string
  location_hint?: string
  points_value: number
  created_at: string
  updated_at: string
}

export interface MemoryPackage {
  id: string
  property_id: string
  user_id: string
  name: string
  description?: string
  template_type: string
  custom_content?: any
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  notification_preferences: any
  theme_preference: 'light' | 'dark'
  timezone: string
  created_at: string
  updated_at: string
}

// Client-side data helpers for dashboard (host UI)
export async function getPropertiesClient(): Promise<Property[]> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching properties:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getPropertiesClient:', error)
    return []
  }
}

export async function getPropertyByIdClient(propertyId: string): Promise<Property | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (error) {
      console.error('Error fetching property (client):', error)
      return null
    }
    return data as unknown as Property
  } catch (err) {
    console.error('Exception in getPropertyByIdClient:', err)
    return null
  }
}

export async function updatePropertyClient(propertyId: string, updates: Partial<Property>): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)

    if (error) {
      console.error('Error updating property (client):', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Exception in updatePropertyClient:', err)
    return false
  }
}

export async function listKbDocsClient(propertyId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('kb_docs')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error listing KB docs:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Exception in listKbDocsClient:', err)
    return []
  }
}

export async function addKbDocClient(propertyId: string, question: string, answer: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('kb_docs')
      .insert({ property_id: propertyId, question, answer })
      .select()
      .single()

    if (error) {
      console.error('Error adding KB doc:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('Exception in addKbDocClient:', err)
    return null
  }
}

export async function updateKbDocClient(id: string, updates: Partial<{ question: string; answer: string }>) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('kb_docs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating KB doc:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('Exception in updateKbDocClient:', err)
    return null
  }
}

export async function deleteKbDocClient(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('kb_docs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting KB doc:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Exception in deleteKbDocClient:', err)
    return false
  }
}

export async function uploadGuidebookFile(propertyId: string, file: File): Promise<string | null> {
  try {
    const supabase = createClient()
    const filePath = `${propertyId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('guidebooks').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (error) {
      console.error('Error uploading guidebook file:', error)
      return null
    }
    const { data } = supabase.storage.from('guidebooks').getPublicUrl(filePath)
    return data.publicUrl
  } catch (err) {
    console.error('Exception in uploadGuidebookFile:', err)
    return null
  }
}

// Booking Management Functions
export async function getPlatformIntegrationsClient() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching platform integrations:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Exception in getPlatformIntegrationsClient:', err)
    return []
  }
}

export async function getBookingsClient(propertyId?: string) {
  try {
    const supabase = createClient()
    let query = supabase
      .from('bookings')
      .select(`
        *,
        connected_listings!inner(
          listing_title,
          platform_name
        )
      `)
      .order('check_in_date', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Exception in getBookingsClient:', err)
    return []
  }
}

export async function createBookingClient(bookingData: {
  property_id: string
  guest_name: string
  guest_email?: string
  check_in_date: string
  check_out_date: string
  guest_count: number
  platform_name: string
  booking_source: string
  total_amount?: number
  special_requests?: string
}) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('Exception in createBookingClient:', err)
    return null
  }
}

export async function updateBookingStatusClient(bookingId: string, status: string, notes?: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bookings')
      .update({ booking_status: status })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking status:', error)
      return null
    }

    // Log the event
    await supabase
      .from('booking_events')
      .insert({
        booking_id: bookingId,
        event_type: 'status_changed',
        event_data: { new_status: status },
        created_by: 'host',
        notes: notes || `Status changed to ${status}`
      })

    return data
  } catch (err) {
    console.error('Exception in updateBookingStatusClient:', err)
    return null
  }
}

export async function connectAirbnbListingClient(propertyId: string, listingData: {
  external_listing_id: string
  listing_title: string
  listing_url?: string
}) {
  try {
    const supabase = createClient()
    
    // First, get or create platform integration
    let { data: integration } = await supabase
      .from('platform_integrations')
      .select('id')
      .eq('platform_name', 'airbnb')
      .single()

    if (!integration) {
      const { data: newIntegration } = await supabase
        .from('platform_integrations')
        .insert({
          platform_name: 'airbnb',
          integration_type: 'manual',
          connection_status: 'connected'
        })
        .select()
        .single()
      
      integration = newIntegration
    }

    if (!integration) {
      throw new Error('Failed to create integration')
    }

    // Create connected listing
    const { data, error } = await supabase
      .from('connected_listings')
      .insert({
        property_id: propertyId,
        integration_id: integration.id,
        external_listing_id: listingData.external_listing_id,
        listing_title: listingData.listing_title,
        listing_url: listingData.listing_url,
        platform_name: 'airbnb'
      })
      .select()
      .single()

    if (error) {
      console.error('Error connecting Airbnb listing:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('Exception in connectAirbnbListingClient:', err)
    return null
  }
}

export async function getConnectedListingsClient(propertyId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('connected_listings')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connected listings:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Exception in getConnectedListingsClient:', err)
    return []
  }
}

// Auth helper types
export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}
