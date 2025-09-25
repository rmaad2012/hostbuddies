import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateProgress = (completedSteps: number, totalSteps: number): number => {
  return Math.min((completedSteps / totalSteps) * 100, 100)
}

export const getProgressEmoji = (progress: number): string => {
  if (progress === 0) return '🎯'
  if (progress < 50) return '🚀'
  if (progress < 100) return '🔥'
  return '🏆'
}

export const getQuestTypeEmoji = (type: 'photo' | 'text'): string => {
  return type === 'photo' ? '📸' : '💬'
}

export const formatPoints = (points: number): string => {
  return points.toLocaleString()
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock data for development
export const mockGuestSession = {
  id: 'session-123',
  property_id: 'property-123',
  guest_hash: 'guest-hash-123',
  track_id: 'track-123',
  points: 150,
  status: 'active'
}

export const mockProperty = {
  id: 'property-123',
  name: 'Cozy Downtown Loft'
}

export const mockTrack = {
  id: 'track-123',
  name: 'Welcome Quest',
  description: 'Complete your welcome journey!',
  total_steps: 3,
  badge_emoji: '🌟'
}

export const mockTrackSteps = [
  {
    id: 'step-1',
    track_id: 'track-123',
    order_idx: 0,
    prompt: "Welcome! Let's start your adventure. Take a selfie with your favorite spot in the property! 📸",
    quest_type: 'photo' as const
  },
  {
    id: 'step-2',
    track_id: 'track-123',
    order_idx: 1,
    prompt: "Tell us what you love most about this space so far! Share your first impressions. ✨",
    quest_type: 'text' as const
  },
  {
    id: 'step-3',
    track_id: 'track-123',
    order_idx: 2,
    prompt: "One more photo! Show us your setup - how you've made this space your own! 🏠",
    quest_type: 'photo' as const
  }
]

export const mockSubmissions = [
  {
    id: 'submission-1',
    session_id: 'session-123',
    step_id: 'step-1',
    proof_url: '/mock-image.jpg',
    text_content: null,
    approved_bool: true,
    points_awarded: 50
  }
]

export const mockKbDocs = [
  {
    id: 'kb-1',
    property_id: 'property-123',
    question: 'What is the WiFi password?',
    answer: 'The WiFi password is "WelcomeHome2024". You can find it on the card next to the router in the living room.'
  },
  {
    id: 'kb-2',
    property_id: 'property-123',
    question: 'How do I check out?',
    answer: 'Check out is at 11 AM. Please leave the keys in the lockbox and ensure all windows and doors are closed. Thank you for staying with us!'
  },
  {
    id: 'kb-3',
    property_id: 'property-123',
    question: 'Where can I park?',
    answer: 'Free street parking is available directly in front of the building. There is also a paid parking garage two blocks away if you prefer covered parking.'
  }
]
