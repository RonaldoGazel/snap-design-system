"use client"

import { cn } from "@/lib/utils"
import { Bot, User, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
  isLast?: boolean
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const isAssistant = message.role === "assistant"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      className={cn(
        "flex gap-4 py-6 px-4 md:px-0",
        isAssistant ? "bg-transparent" : "bg-transparent"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isAssistant
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isAssistant ? "SNAP AI" : "Você"}
          </span>
          <span className="text-xs text-text-muted">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Actions */}
        {isAssistant && (
          <div className="flex items-center gap-1 pt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-text-muted hover:text-foreground hover:bg-accent"
              onClick={handleCopy}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">
                {copied ? "Copiado" : "Copiar mensagem"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 hover:bg-accent",
                feedback === "up"
                  ? "text-success"
                  : "text-text-muted hover:text-foreground"
              )}
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span className="sr-only">Resposta útil</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 hover:bg-accent",
                feedback === "down"
                  ? "text-destructive"
                  : "text-text-muted hover:text-foreground"
              )}
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span className="sr-only">Resposta não útil</span>
            </Button>
            {isLast && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-text-muted hover:text-foreground hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="sr-only">Regenerar resposta</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
