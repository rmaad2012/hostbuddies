'use client'

import { useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Building,
  Upload,
  FileText,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  Wifi,
  Trash2,
  Clock,
  MapPin,
  Video
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface PropertySetupWizardProps {
  onComplete: (propertyId: string) => void
}

interface PropertyData {
  name: string
  guidebook_url?: string
  guidebook_content?: string
  checkin_video_url?: string
  check_in_instructions: string
  wifi_name: string
  wifi_password: string
  trash_day: string
  quiet_hours: string
  persona_style: 'friendly_guide' | 'foodie_pal' | 'trail_ranger'
}

const steps = [
  {
    id: 'basic',
    name: 'Basic Info',
    icon: Building,
    description: 'Property name and location'
  },
  {
    id: 'guidebook',
    name: 'Guidebook',
    icon: FileText,
    description: 'Upload house guidelines'
  },
  {
    id: 'details',
    name: 'Key Details',
    icon: MapPin,
    description: 'Check-in, WiFi, and rules'
  },
  {
    id: 'persona',
    name: 'AI Persona',
    icon: User,
    description: 'Choose your host style'
  }
]

const personas = [
  {
    id: 'friendly_guide',
    name: 'Friendly Guide',
    description: 'Warm, welcoming, and helpful for all types of travelers',
    personality: 'Professional yet approachable, focuses on comfort and convenience',
    icon: '😊'
  },
  {
    id: 'foodie_pal',
    name: 'Foodie Pal',
    description: 'Food-focused, knows all the best local restaurants and cooking tips',
    personality: 'Enthusiastic about culinary experiences and local food scene',
    icon: '🍽️'
  },
  {
    id: 'trail_ranger',
    name: 'Trail Ranger',
    description: 'Adventure-focused, perfect for outdoor enthusiasts and explorers',
    personality: 'Knowledgeable about outdoor activities and local adventures',
    icon: '🏔️'
  }
]

export default function PropertySetupWizard({ onComplete }: PropertySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const supabase = createClient()
  
  const [formData, setFormData] = useState<PropertyData>({
    name: '',
    guidebook_content: '',
    checkin_video_url: '',
    check_in_instructions: '',
    wifi_name: '',
    wifi_password: '',
    trash_day: 'Monday',
    quiet_hours: '10 PM - 8 AM',
    persona_style: 'friendly_guide'
  })

  // File upload handling
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadingFile(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('guidebooks')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('guidebooks')
        .getPublicUrl(fileName)

      setFormData(prev => ({
        ...prev,
        guidebook_url: publicUrl
      }))

      // For now, just store the file URL and a placeholder for content
      // In production, you'd use proper PDF parsing libraries like pdf-parse
      let textContent = ''
      
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        // Only extract text from actual text files
        try {
          textContent = await file.text()
        } catch (error) {
          console.warn('Could not extract text content:', error)
          textContent = `Guidebook file uploaded: ${file.name}`
        }
      } else {
        // For PDFs and other binary files, just store a reference
        textContent = `Guidebook file uploaded: ${file.name} (${file.type})`
      }
      
      setFormData(prev => ({
        ...prev,
        guidebook_content: textContent
      }))

      // Process the guidebook content with AI for the knowledge base
      // This will be done after property creation

    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    multiple: false
  })

  // Video upload handling
  const onVideoDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadingVideo(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `checkin-videos/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('property-assets')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('property-assets')
        .getPublicUrl(fileName)

      setFormData(prev => ({
        ...prev,
        checkin_video_url: publicUrl
      }))

    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video. Please try again.')
    } finally {
      setUploadingVideo(false)
    }
  }

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  })

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      console.log('Starting property creation...')

      // Clean and prepare property data for API
      const cleanText = (text: string | undefined | null): string => {
        if (!text) return ''
        // Remove problematic characters that could cause Unicode issues
        return text.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
      }

      const propertyData = {
        name: cleanText(formData.name),
        guidebook_url: formData.guidebook_url || '',
        guidebook_content: cleanText(formData.guidebook_content),
        checkin_video_url: formData.checkin_video_url || '',
        check_in_instructions: cleanText(formData.check_in_instructions),
        wifi_name: cleanText(formData.wifi_name),
        wifi_password: cleanText(formData.wifi_password),
        trash_day: cleanText(formData.trash_day),
        quiet_hours: cleanText(formData.quiet_hours),
        persona_style: formData.persona_style || 'friendly_guide'
      }
      console.log('Property data:', propertyData)

      // Call server-side API to create property
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create property')
      }

      const result = await response.json()
      console.log('Property created successfully:', result.propertyId)
      onComplete(result.propertyId)
    } catch (error) {
      console.error('Error creating property:', error)
      // Show user-friendly error message
      alert(`Failed to create property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="property-name" className="block text-sm font-medium text-gray-700 mb-2">
                Property Name *
              </label>
              <input
                id="property-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="e.g., Cozy Downtown Loft"
                required
              />
            </div>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h3 className="font-medium text-slate-900 mb-2">What happens next?</h3>
              <p className="text-sm text-slate-700">
                We'll help you upload your house guidebook, set up key details like WiFi and check-in instructions,
                and customize your AI host's personality to match your property's vibe.
              </p>
            </div>
          </div>
        )

      case 1: // Guidebook Upload
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your House Guidebook</h3>
              <p className="text-gray-600 mb-4">
                Upload your existing house rules, local recommendations, or property guide. 
                Accepted formats: PDF, TXT, MD
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive 
                  ? 'border-slate-400 bg-slate-50' 
                  : 'border-gray-300 hover:border-slate-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                {uploadingFile ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
                ) : (
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {uploadingFile ? 'Uploading...' : 'Drop your guidebook here (optional)'}
                  </p>
                  <p className="text-gray-600">or click to browse files</p>
                  <p className="text-sm text-gray-500 mt-2">PDF, TXT, MD up to 10MB</p>
                  <p className="text-xs text-gray-400 mt-1">You can skip this and add information manually later</p>
                </div>
              </div>
            </div>

            {formData.guidebook_url && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-800 font-medium">Guidebook uploaded successfully!</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Don't have a guidebook yet?</h4>
              <p className="text-sm text-blue-700">
                No problem! You can skip this step and add details manually in the next steps. 
                We'll help you create comprehensive guest information.
              </p>
            </div>
          </div>
        )

      case 2: // Key Details
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Essential Property Details</h3>
              <p className="text-gray-600 mb-6">
                Provide key information your AI host needs to help guests.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in Instructions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Check-in Instructions
                </label>
                <textarea
                  value={formData.check_in_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_in_instructions: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., Use the lockbox code 1234. The key is the silver one. Enter through the blue door..."
                />
              </div>

              {/* Check-in Video */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="inline w-4 h-4 mr-1" />
                  Check-in Video Tutorial (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload a video showing guests how to enter your property. This helps reduce confusion and support requests.
                </p>
                
                <div
                  {...getVideoRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isVideoActive 
                      ? 'border-slate-400 bg-slate-50' 
                      : 'border-gray-300 hover:border-slate-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getVideoInputProps()} />
                  <div className="space-y-3">
                    {uploadingVideo ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                    ) : formData.checkin_video_url ? (
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">Video uploaded successfully</span>
                      </div>
                    ) : (
                      <Video className="mx-auto h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.checkin_video_url ? 'Replace check-in video' : 'Upload check-in video'}
                      </p>
                      <p className="text-xs text-gray-500">
                        MP4, MOV, or AVI up to 50MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WiFi Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wifi className="inline w-4 h-4 mr-1" />
                  WiFi Network Name
                </label>
                <input
                  type="text"
                  value={formData.wifi_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, wifi_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="e.g., HomeWiFi_Guest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WiFi Password
                </label>
                <input
                  type="text"
                  value={formData.wifi_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, wifi_password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="e.g., WelcomeHome2024"
                />
              </div>

              {/* Trash Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trash2 className="inline w-4 h-4 mr-1" />
                  Trash Collection Day
                </label>
                <select
                  value={formData.trash_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, trash_day: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              {/* Quiet Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Quiet Hours
                </label>
                <input
                  type="text"
                  value={formData.quiet_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="e.g., 10 PM - 8 AM"
                />
              </div>
            </div>
          </div>
        )

      case 3: // Persona Selection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Your AI Host Persona</h3>
              <p className="text-gray-600 mb-6">
                Select the personality style that best matches your property and target guests.
              </p>
            </div>

            <div className="grid gap-6">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  onClick={() => setFormData(prev => ({ ...prev, persona_style: persona.id as any }))}
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.persona_style === persona.id
                      ? 'border-slate-500 bg-slate-50'
                      : 'border-gray-200 hover:border-slate-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{persona.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{persona.name}</h4>
                      <p className="text-gray-600 mb-2">{persona.description}</p>
                      <p className="text-sm text-gray-500">{persona.personality}</p>
                    </div>
                    {formData.persona_style === persona.id && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return formData.name.length > 0
      case 1:
        return true // Guidebook is optional
      case 2:
        return formData.check_in_instructions.length > 0
      case 3:
        return formData.persona_style !== ''
      default:
        return false
    }
  }

  const canProceed = isStepComplete(currentStep)

  return (
    <div className="bg-white shadow-xl rounded-lg border border-gray-200">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                <div className="flex items-center">
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    stepIdx < currentStep || isStepComplete(stepIdx)
                      ? 'bg-slate-600'
                      : stepIdx === currentStep
                      ? 'border-2 border-slate-600 bg-white'
                      : 'border-2 border-gray-300 bg-white'
                  }`}>
                    {stepIdx < currentStep || (stepIdx === currentStep && isStepComplete(stepIdx)) ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <step.icon className={`h-5 w-5 ${
                        stepIdx === currentStep ? 'text-slate-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    stepIdx <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {steps[currentStep].name}
          </h2>
          <p className="text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>

        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            currentStep === 0
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed || loading}
            className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                Create Property
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              canProceed
                ? 'text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg'
                : 'border border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  )
}
