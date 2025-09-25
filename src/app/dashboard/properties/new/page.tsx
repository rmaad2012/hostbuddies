'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PropertySetupWizard from '@/components/dashboard/PropertySetupWizard'

export default function NewPropertyPage() {
  const router = useRouter()
  
  const handleComplete = (propertyId: string) => {
    // Redirect to properties list with success message
    router.push(`/dashboard/properties?created=${propertyId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Property</h1>
        <p className="mt-2 text-gray-600">
          Set up your AI host with property details, guidelines, and personalization options.
        </p>
      </div>
      
      <PropertySetupWizard onComplete={handleComplete} />
    </div>
  )
}
