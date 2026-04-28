"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChatSidebar } from "./chat-sidebar"
import { ChatHeader } from "./chat-header"
import { ChatMessage, type Message } from "./chat-message"
import { ChatInput } from "./chat-input"
import { WelcomeScreen } from "./welcome-screen"
import { Loader2 } from "lucide-react"

// Mock chat history
const mockChatHistory = [
  {
    id: "1",
    title: "Busca de pessoa suspeita",
    date: new Date().toISOString(),
    preview: "Como posso encontrar informações sobre...",
  },
  {
    id: "2",
    title: "Relatório de monitoramento",
    date: new Date().toISOString(),
    preview: "Gere um relatório completo das...",
  },
  {
    id: "3",
    title: "Análise de vínculos",
    date: new Date(Date.now() - 86400000).toISOString(),
    preview: "Quais são os vínculos conhecidos de...",
  },
  {
    id: "4",
    title: "Pendências de cadastro",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    preview: "Liste todas as pendências que...",
  },
  {
    id: "5",
    title: "Estatísticas semanais",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    preview: "Mostre as estatísticas de alertas...",
  },
]

// Mock AI responses
const mockResponses: Record<string, string> = {
  default: `Entendi sua solicitação. Vou analisar os dados disponíveis no sistema SNAP para fornecer as informações que você precisa.

Com base nos registros do sistema, posso ajudá-lo com:
• **Busca de pessoas** - Pesquise por nome, RG, CPF ou outros identificadores
• **Análise de vínculos** - Identifique conexões entre indivíduos
• **Relatórios** - Gere relatórios personalizados
• **Alertas** - Monitore eventos em tempo real

Como posso ajudá-lo especificamente?`,
  buscar:
    "Para buscar informações sobre uma pessoa no sistema SNAP, você pode usar os seguintes critérios:\n\n• **Nome completo ou parcial**\n• **RG ou CPF**\n• **Vulgo/apelido**\n• **Tags de classificação**\n\nO sistema retornará todos os registros correspondentes, incluindo histórico de vínculos, alertas relacionados e status atual. Qual critério você gostaria de usar para a busca?",
  relatório:
    "Posso gerar diversos tipos de relatórios para você:\n\n📊 **Relatório de Monitoramento**\n- Resumo das últimas 24/48/72 horas\n- Alertas críticos e pendências\n\n📈 **Relatório Estatístico**\n- Tendências de alertas\n- Distribuição por categoria de risco\n\n📋 **Relatório de Pessoas**\n- Novos cadastros\n- Atualizações de vínculos\n\nQual tipo de relatório você precisa?",
  alertas:
    "**Status de Alertas - Últimas 24 horas**\n\n🔴 **Alertas Críticos:** 12\n🟠 **Alertas de Alta Prioridade:** 28\n🟡 **Alertas Médios:** 45\n🟢 **Alertas Baixos:** 89\n\nOs alertas críticos incluem:\n1. 4 movimentações suspeitas detectadas\n2. 3 novos vínculos sensíveis identificados\n3. 5 pendências de revisão urgente\n\nDeseja que eu detalhe algum alerta específico?",
  tendências:
    "**Análise de Tendências - Última Semana**\n\n📈 **Crescimento de Alertas:** +15% comparado à semana anterior\n\n**Por Categoria:**\n- Risco Crítico: ↑ 8%\n- Risco Alto: ↑ 12%\n- Risco Médio: ↓ 3%\n- Risco Baixo: ↑ 22%\n\n**Padrões Identificados:**\n• Pico de alertas entre 18h-22h\n• Maior concentração na região metropolitana\n• 68% dos alertas relacionados a vínculos existentes\n\nPosso gerar um relatório detalhado se necessário.",
  pendências:
    "**Pendências de Cadastro Atuais**\n\n📋 **Total de Pendências:** 35\n\n**Por Status:**\n- Aguardando revisão: 18\n- Em análise: 10\n- Deduplicação necessária: 7\n\n**Urgentes (últimas 24h):**\n1. Wagner Almeida Sobrinho - Novo Vínculo Sensível\n2. Carla Eduarda Mentes da Silva - Atualização de cadastro\n3. Fábio Henrique Rocha - Revisão de risco\n\nDeseja que eu abra alguma dessas pendências?",
}

export function ChatContainer() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState(mockChatHistory)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Find matching response based on keywords
    let responseText = mockResponses.default
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes("buscar") || lowerContent.includes("pessoa") || lowerContent.includes("encontrar")) {
      responseText = mockResponses.buscar
    } else if (lowerContent.includes("relatório") || lowerContent.includes("gere") || lowerContent.includes("gerar")) {
      responseText = mockResponses.relatório
    } else if (lowerContent.includes("alerta") || lowerContent.includes("verificar")) {
      responseText = mockResponses.alertas
    } else if (lowerContent.includes("tendência") || lowerContent.includes("análise") || lowerContent.includes("analis")) {
      responseText = mockResponses.tendências
    } else if (lowerContent.includes("pendência") || lowerContent.includes("revisão") || lowerContent.includes("cadastro")) {
      responseText = mockResponses.pendências
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)

    // Update chat history if this is a new chat
    if (!activeChatId) {
      const newChatId = Date.now().toString()
      setActiveChatId(newChatId)
      setChatHistory((prev) => [
        {
          id: newChatId,
          title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
          date: new Date().toISOString(),
          preview: content.slice(0, 50),
        },
        ...prev,
      ])
    }
  }

  const handleNewChat = () => {
    setActiveChatId(null)
    setMessages([])
  }

  const handleSelectChat = (id: string) => {
    setActiveChatId(id)
    // In a real app, you would load the messages for this chat
    setMessages([])
  }

  const handleDeleteChat = (id: string) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== id))
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages([])
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-72" : "lg:ml-16"
        )}
      >
        {/* Header */}
        <ChatHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            ) : (
              <div className="pb-32">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLast={
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-4 py-6 px-4 md:px-0">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground">
                          SNAP AI
                        </span>
                        <span className="text-xs text-text-muted">
                          digitando...
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
