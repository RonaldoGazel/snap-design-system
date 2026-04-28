"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { Send, Paperclip, Mic, Square, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function ChatInput({
  onSendMessage,
  isLoading,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2 p-3 bg-card rounded-2xl border border-border shadow-lg">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 text-text-muted hover:text-foreground hover:bg-accent rounded-xl"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Anexar arquivo</span>
        </Button>

        {/* Input area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem..."
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent text-foreground placeholder:text-text-muted",
              "focus:outline-none py-2.5 px-1 text-sm leading-relaxed",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "max-h-[200px] overflow-y-auto"
            )}
          />
        </div>

        {/* Voice button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 text-text-muted hover:text-foreground hover:bg-accent rounded-xl"
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Gravação de voz</span>
        </Button>

        {/* Send/Stop button */}
        <Button
          size="icon"
          className={cn(
            "shrink-0 h-10 w-10 rounded-xl transition-all",
            message.trim() && !isLoading
              ? "bg-primary hover:bg-primary-dark text-primary-foreground"
              : "bg-muted text-text-muted cursor-not-allowed"
          )}
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isLoading ? "Parar geração" : "Enviar mensagem"}
          </span>
        </Button>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-text-muted">
        <Sparkles className="h-3 w-3" />
        <span>SNAP AI pode cometer erros. Verifique informações importantes.</span>
      </div>
    </div>
  )
}
