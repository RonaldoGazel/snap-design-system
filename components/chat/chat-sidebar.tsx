"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Search,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatHistory {
  id: string
  title: string
  date: string
  preview: string
}

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  chatHistory: ChatHistory[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
}

export function ChatSidebar({
  isOpen,
  onToggle,
  chatHistory,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredHistory = chatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedHistory = filteredHistory.reduce(
    (acc, chat) => {
      const date = new Date(chat.date)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      let group = "Anteriores"
      if (date.toDateString() === today.toDateString()) {
        group = "Hoje"
      } else if (date.toDateString() === yesterday.toDateString()) {
        group = "Ontem"
      } else if (date > weekAgo) {
        group = "Últimos 7 dias"
      }

      if (!acc[group]) acc[group] = []
      acc[group].push(chat)
      return acc
    },
    {} as Record<string, ChatHistory[]>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isOpen ? "w-72" : "w-0 lg:w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  S
                </span>
              </div>
              <span className="font-semibold text-sidebar-foreground tracking-wider">
                SNAP
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className={cn("p-3", !isOpen && "lg:px-2")}>
          <Button
            onClick={onNewChat}
            className={cn(
              "bg-primary hover:bg-primary-dark text-primary-foreground transition-colors",
              isOpen ? "w-full justify-start gap-2" : "lg:w-10 lg:h-10 lg:p-0"
            )}
          >
            <Plus className="h-4 w-4" />
            {isOpen && <span>Nova conversa</span>}
          </Button>
        </div>

        {/* Search */}
        {isOpen && (
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-input border border-border text-foreground placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {isOpen ? (
            Object.entries(groupedHistory).map(([group, chats]) => (
              <div key={group} className="mb-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        activeChatId === chat.id
                          ? "bg-sidebar-accent"
                          : "hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => onSelectChat(chat.id)}
                    >
                      <MessageSquare className="h-4 w-4 text-text-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sidebar-foreground truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {chat.preview}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-foreground hover:bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover border-border"
                        >
                          <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => onDeleteChat(chat.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-2 pt-2">
              {chatHistory.slice(0, 5).map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10",
                    activeChatId === chat.id
                      ? "bg-sidebar-accent"
                      : "hover:bg-sidebar-accent/50"
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 text-text-muted" />
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent",
              isOpen ? "w-full justify-start gap-2" : "lg:w-10 lg:h-10 lg:p-0"
            )}
          >
            <Settings className="h-4 w-4" />
            {isOpen && <span>Configurações</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
