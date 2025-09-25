import { createServerSupabaseClient } from '@/lib/supabase-server'
import AIConsultant from '@/components/dashboard/AIConsultant'

export default async function ConsultantPage() {
  const supabase = await createServerSupabaseClient()

  // Get the user's first property for context; fallback to sample
  let propertyId = 'demo-property'
  let propertyName = 'Demo Property'

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
      if (properties && properties.length > 0) {
        propertyId = properties[0].id
        propertyName = properties[0].name
      }
    }
  } catch {
    // keep defaults
  }

  return (
    <div className="space-y-6">
      <AIConsultant propertyId={propertyId} propertyName={propertyName} />
    </div>
  )
}


