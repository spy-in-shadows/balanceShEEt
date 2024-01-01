'use client'

import { useState } from 'react'
import { Send, Bot, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ShubhLabhChatProps {
  onClose: () => void
}

export default function ShubhLabhChat({ onClose }: ShubhLabhChatProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm **Shubh Labh**, your business analytics assistant. 🎯\n\nI can help you with:\n- **Top products** analysis\n- **Sales forecasting** and predictions\n- **Inventory alerts** and issues\n- **Revenue summaries** and trends\n\nTry asking me:\n- 'Show me the top 5 products'\n- 'What's the sales forecast?'\n- 'Any alerts or issues?'\n- 'Give me a sales summary'",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/shubh-labh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(data.timestamp),
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to get response',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-bs-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-white p-2">
            <Bot className="h-5 w-5 text-bs-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Shubh Labh</h3>
            <p className="text-xs text-white/80">Analytics Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-bs-primary text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="bg-bs-primary hover:bg-bs-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
