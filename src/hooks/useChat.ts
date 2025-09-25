import { useState } from 'react'

interface UseChatOptions {
  propertyId: string
  sessionId: string
}

export const useChat = ({ propertyId, sessionId }: UseChatOptions) => {
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (message: string): Promise<string> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          propertyId,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error sending message:', error)
      return "I'm having trouble responding right now. Please try again! 🤔"
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendMessage,
    isLoading,
  }
}
