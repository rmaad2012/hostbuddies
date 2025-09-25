'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  MapPin,
  Plus,
  Trash2,
  Upload,
  Image,
  GripVertical,
  Eye,
  Save,
  Brain,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface Property {
  id: string
  name: string
}

interface Activity {
  id: string
  order_index: number
  description: string
  reference_image_url?: string
  location: string
  duration_minutes: number
}

interface ItineraryBuilderProps {
  properties: Property[]
  onComplete: (itineraryId: string) => void
}

export default function ItineraryBuilder({ properties, onComplete }: ItineraryBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const supabase = createClient()

  const [itineraryData, setItineraryData] = useState({
    name: '',
    description: '',
    property_id: properties[0]?.id || '',
    status: 'draft' as 'draft' | 'active' | 'inactive'
  })

  // AI Assistant state
  const [aiRecommendations, setAiRecommendations] = useState({
    restaurants: '',
    attractions: '',
    activities: '',
    localTips: '',
    targetAudience: 'families',
    duration: 'full-day'
  })

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'temp-1',
      order_index: 0,
      description: '',
      location: '',
      duration_minutes: 30
    }
  ])

  const addActivity = () => {
    const newActivity: Activity = {
      id: `temp-${Date.now()}`,
      order_index: activities.length,
      description: '',
      location: '',
      duration_minutes: 30
    }
    setActivities([...activities, newActivity])
  }

  const removeActivity = (activityId: string) => {
    if (activities.length > 1) {
      setActivities(activities.filter(a => a.id !== activityId).map((a, index) => ({ ...a, order_index: index })))
    }
  }

  const updateActivity = (activityId: string, updates: Partial<Activity>) => {
    setActivities(activities.map(a => 
      a.id === activityId ? { ...a, ...updates } : a
    ))
  }

  const moveActivity = (fromIndex: number, toIndex: number) => {
    const newActivities = [...activities]
    const [movedActivity] = newActivities.splice(fromIndex, 1)
    newActivities.splice(toIndex, 0, movedActivity)
    
    // Update order indices
    const reorderedActivities = newActivities.map((a, index) => ({ ...a, order_index: index }))
    setActivities(reorderedActivities)
  }

  const handleImageUpload = async (activityId: string, file: File) => {
    setUploadingImage(activityId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/itineraries/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('itinerary-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('itinerary-images')
        .getPublicUrl(fileName)

      updateActivity(activityId, { reference_image_url: publicUrl })

    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploadingImage(null)
    }
  }

  const generateAIItinerary = async () => {
    setAiGenerating(true)
    
    try {
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendations: aiRecommendations,
          propertyName: properties.find(p => p.id === itineraryData.property_id)?.name || 'Property'
        }),
      })

      if (!response.ok) throw new Error('Failed to generate itinerary')

      const data = await response.json()
      
      // Update itinerary data with AI suggestions
      setItineraryData(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description
      }))

      // Update activities with AI-generated suggestions
      if (data.activities && data.activities.length > 0) {
        const aiActivities = data.activities.map((activity: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          order_index: index,
          description: activity.description,
          location: activity.location,
          duration_minutes: activity.duration || 30
        }))
        setActivities(aiActivities)
      }

      setShowAIAssistant(false)
    } catch (error) {
      console.error('Error generating AI itinerary:', error)
      alert('Failed to generate itinerary. Please try again.')
    } finally {
      setAiGenerating(false)
    }
  }

  const createImageDropzone = (activityId: string) => {
    const onDrop = (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        handleImageUpload(activityId, file)
      }
    }

    return useDropzone({
      onDrop,
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
      },
      multiple: false
    })
  }

  const handleSave = async (publish = false) => {
    if (!itineraryData.name.trim()) return

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const itineraryId = `itinerary_${Date.now()}`

      // Create itinerary
      const { error: itineraryError } = await supabase
        .from('guest_itineraries')
        .insert({
          id: itineraryId,
          user_id: user.id,
          property_id: itineraryData.property_id,
          name: itineraryData.name,
          description: itineraryData.description,
          status: publish ? 'active' : itineraryData.status
        })

      if (itineraryError) throw itineraryError

      // Create activities
      const activityPromises = activities
        .filter(activity => activity.description.trim())
        .map((activity, index) => 
          supabase
            .from('itinerary_activities')
            .insert({
              id: `activity_${Date.now()}_${index}`,
              itinerary_id: itineraryId,
              order_index: index,
              description: activity.description,
              reference_image_url: activity.reference_image_url,
              location: activity.location,
              duration_minutes: activity.duration_minutes
            })
        )

      await Promise.all(activityPromises)
      onComplete(itineraryId)

    } catch (error) {
      console.error('Error creating itinerary:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Itinerary Details */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Itinerary Details</h3>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itinerary Name *
              </label>
              <input
                type="text"
                value={itineraryData.name}
                onChange={(e) => setItineraryData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="e.g., Downtown Discovery Adventure"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property
              </label>
              <select
                value={itineraryData.property_id}
                onChange={(e) => setItineraryData(prev => ({ ...prev, property_id: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={itineraryData.description}
              onChange={(e) => setItineraryData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Describe your guest itinerary experience..."
            />
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-gradient-to-r from-tan-50 to-cream-100 shadow-sm rounded-lg border border-tan-200">
        <div className="px-6 py-4 border-b border-tan-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-charcoal-800 to-charcoal-900 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-charcoal-900">AI Itinerary Assistant</h3>
              <p className="text-sm text-charcoal-600">
                Let AI help you create personalized itineraries based on your local recommendations
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-tan-600 to-gold-600 text-white rounded-lg hover:from-tan-700 hover:to-gold-700 transition-all duration-300"
          >
            {showAIAssistant ? 'Hide Assistant' : 'Use AI Assistant'}
          </button>
        </div>

        {showAIAssistant && (
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Must-Visit Restaurants
                  </label>
                  <textarea
                    value={aiRecommendations.restaurants}
                    onChange={(e) => setAiRecommendations(prev => ({ ...prev, restaurants: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-tan-300 rounded-lg focus:ring-2 focus:ring-tan-500 focus:border-transparent bg-white"
                    placeholder="e.g., Tony's Italian Bistro for authentic pasta, Corner Coffee Shop for the best local roast..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Key Attractions & Landmarks
                  </label>
                  <textarea
                    value={aiRecommendations.attractions}
                    onChange={(e) => setAiRecommendations(prev => ({ ...prev, attractions: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-tan-300 rounded-lg focus:ring-2 focus:ring-tan-500 focus:border-transparent bg-white"
                    placeholder="e.g., Historic Downtown Museum, Riverside Park with beautiful views, Old Town Square..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Unique Activities & Experiences
                  </label>
                  <textarea
                    value={aiRecommendations.activities}
                    onChange={(e) => setAiRecommendations(prev => ({ ...prev, activities: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-tan-300 rounded-lg focus:ring-2 focus:ring-tan-500 focus:border-transparent bg-white"
                    placeholder="e.g., Sunset kayaking, Local artisan market on Saturdays, Brewery tour..."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Local Tips & Hidden Gems
                  </label>
                  <textarea
                    value={aiRecommendations.localTips}
                    onChange={(e) => setAiRecommendations(prev => ({ ...prev, localTips: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-tan-300 rounded-lg focus:ring-2 focus:ring-tan-500 focus:border-transparent bg-white"
                    placeholder="e.g., Best ice cream at Miller's Creamery, Free parking behind the library, Ask for the secret menu at..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={aiRecommendations.targetAudience}
                    onChange={(e) => setAiRecommendations(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-4 py-3 border border-tan-300 rounded-lg focus:ring-2 focus:ring-tan-500 focus:border-transparent bg-white"
                  >
                    <option value="families">Families with Children</option>
                    <option value="couples">Couples & Romance</option>
                    <option value="adventure">Adventure Seekers</option>
                    <option value="culture">Culture & History Enthusiasts</option>
                    <option value="foodie">Food & Drink Lovers</option>
                    <option value="relaxation">Relaxation & Wellness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Itinerary Duration
                  </label>
                  <select
                    value={aiRecommendations.duration}
                    onChange={(e) => setAiRecommendations(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-3 border border-tan-300 rounded-lg focus:ring-2 focus:ring-tan-500 focus:border-transparent bg-white"
                  >
                    <option value="half-day">Half Day (4-5 hours)</option>
                    <option value="full-day">Full Day (8-10 hours)</option>
                    <option value="weekend">Weekend (2-3 days)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-4 border-t border-tan-200">
              <button
                onClick={generateAIItinerary}
                disabled={aiGenerating || !aiRecommendations.restaurants || !aiRecommendations.attractions}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-charcoal-800 to-charcoal-900 text-white rounded-lg hover:from-charcoal-700 hover:to-charcoal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {aiGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Itinerary...
                  </>
                ) : (
                  <>
                    Generate AI Itinerary
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-charcoal-600">
              <p>AI will create 3 personalized day itineraries based on your recommendations</p>
            </div>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Itinerary Activities</h3>
          <button
            onClick={addActivity}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {activities.map((activity, index) => {
            const dropzone = createImageDropzone(activity.id)
            
            return (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-6 relative">
                {/* Activity Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center cursor-move">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-medium">
                      Activity {index + 1}
                    </div>
                  </div>
                  {activities.length > 1 && (
                    <button
                      onClick={() => removeActivity(activity.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Text Content */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Description *
                      </label>
                      <textarea
                        value={activity.description}
                        onChange={(e) => updateActivity(activity.id, { description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                        placeholder="Describe this activity... Make it engaging and informative!"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={activity.location}
                        onChange={(e) => updateActivity(activity.id, { location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                        placeholder="e.g., Downtown Park, Local Museum"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={activity.duration_minutes}
                        onChange={(e) => updateActivity(activity.id, { duration_minutes: parseInt(e.target.value) || 30 })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Right Column - Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Image (Optional)
                    </label>
                    
                    {activity.reference_image_url ? (
                      <div className="relative">
                        <img
                          src={activity.reference_image_url}
                          alt="Activity reference"
                          className="w-full h-40 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => updateActivity(activity.id, { reference_image_url: undefined })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        {...dropzone.getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          dropzone.isDragActive 
                            ? 'border-slate-400 bg-slate-50' 
                            : 'border-gray-300 hover:border-slate-400 hover:bg-gray-50'
                        }`}
                      >
                        <input {...dropzone.getInputProps()} />
                        {uploadingImage === activity.id ? (
                          <div className="space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                            <p className="text-sm text-gray-600">Uploading...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Image className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="text-sm text-gray-600">
                              <p>Drop image here or click to upload</p>
                              <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center py-6">
        <div className="text-sm text-gray-500">
          {activities.filter(a => a.description.trim()).length} activity(ies) ready
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => handleSave(false)}
            disabled={loading || !itineraryData.name.trim()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          
          <button
            onClick={() => handleSave(true)}
            disabled={loading || !itineraryData.name.trim() || activities.filter(a => a.description.trim()).length === 0}
            className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {loading ? 'Publishing...' : 'Publish Itinerary'}
          </button>
        </div>
      </div>
    </div>
  )
}
