"use client"

import { Menu, Bell, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatHeaderProps {
  onMenuClick: () => void
  model?: string
}

export function ChatHeader({ onMenuClick, model = "SNAP AI v2" }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground hover:bg-accent"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>

        {/* Model selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-foreground hover:bg-accent font-medium"
            >
              <span>{model}</span>
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-popover border-border"
          >
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">SNAP AI v2</span>
                <span className="text-xs text-text-muted">
                  Modelo padrão, equilibrado
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">SNAP AI Pro</span>
                <span className="text-xs text-text-muted">
                  Análise avançada de dados
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">SNAP AI Rápido</span>
                <span className="text-xs text-text-muted">
                  Respostas mais rápidas
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground hover:bg-accent"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          <span className="sr-only">Notificações</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-foreground hover:bg-accent"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-sm">
                  YD
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover border-border"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">SEAP-RJ</p>
              <p className="text-xs text-text-muted">
                Secretaria de Estado de Administração Penitenciária
              </p>
            </div>
            <DropdownMenuItem className="text-foreground hover:bg-accent cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
