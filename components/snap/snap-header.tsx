"use client"

import { Bell, Sun, Moon, ChevronRight } from "lucide-react"
import { SnapLogo } from "./snap-logo"
import { useTheme } from "@/hooks/use-theme"
import { verticals, type Vertical } from "@/lib/snap-tokens"

/**
 * SNAP Header Global
 * 
 * Componentes:
 * - App Switcher (grid 9 pontos) à esquerda
 * - Logo SNAP
 * - Breadcrumb com separadores
 * - Área direita: notificações, toggle tema, info organização, avatar
 * - Linha separadora com cor da vertical ativa
 * 
 * Regras do Breadcrumb:
 * - Primeiro item = Vertical (cor da vertical + ícone + font-medium)
 * - Itens intermediários = #696969 + font-medium
 * - Item atual (último) = text-foreground + font-semibold
 */

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface SnapHeaderProps {
  /** Vertical ativa (define a cor da linha separadora e primeiro breadcrumb) */
  vertical?: Vertical
  /** Itens do breadcrumb (primeiro item será a vertical automaticamente) */
  breadcrumb?: BreadcrumbItem[]
  /** Nome da organização */
  organizacao?: string
  /** Sigla da organização (exibida no badge) */
  organizacaoSigla?: string
  /** Iniciais do usuário para o avatar */
  userInitials?: string
  /** Número de notificações */
  notificationCount?: number
  /** Callback ao clicar no app switcher */
  onAppSwitcherClick?: () => void
}

// Ícone App Switcher (grid 3x3)
function AppSwitcherIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <circle cx="5" cy="5" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  )
}

// Ícone Home (casinha)
function HomeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

export function SnapHeader({
  vertical = "administracao",
  breadcrumb = [],
  organizacao = "Organização",
  organizacaoSigla = "ORG",
  userInitials = "US",
  notificationCount = 0,
  onAppSwitcherClick,
}: SnapHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const verticalData = verticals[vertical]
  const verticalColor = verticalData.hex

  return (
    <header className="w-full">
      {/* Barra principal */}
      <div className="h-14 px-4 flex items-center justify-between bg-background border-b border-border">
        {/* Lado esquerdo: App Switcher + Logo + Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* App Switcher */}
          <button
            onClick={onAppSwitcherClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Abrir menu de aplicativos"
          >
            <AppSwitcherIcon className="w-5 h-5 text-foreground" />
          </button>

          {/* Separador vertical */}
          <div className="w-px h-6 bg-border" />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            {/* Item da Vertical (primeiro) */}
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4" style={{ color: verticalColor }} />
              <span 
                className="font-sans text-sm font-medium"
                style={{ color: verticalColor }}
              >
                {verticalData.name}
              </span>
            </div>

            {/* Itens intermediários e final */}
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1
              return (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#696969]" />
                  {item.icon && (
                    <span className={isLast ? "text-foreground" : "text-[#696969]"}>
                      {item.icon}
                    </span>
                  )}
                  <span 
                    className={`font-sans text-sm ${
                      isLast 
                        ? "text-foreground font-semibold" 
                        : "text-[#696969] font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Lado direito: Notificações + Tema + Organização + Avatar */}
        <div className="flex items-center gap-4">
          {/* Notificações */}
          <button
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label={`${notificationCount} notificações`}
          >
            <Bell className="w-5 h-5 text-foreground" />
            {notificationCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                style={{ backgroundColor: verticalColor }}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Toggle Tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>

          {/* Separador */}
          <div className="w-px h-6 bg-border" />

          {/* Info Organização */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-sans text-xs text-text-muted">{organizacaoSigla}</div>
              <div className="font-sans text-sm text-foreground truncate max-w-[150px]">
                {organizacao}
              </div>
            </div>

            {/* Avatar */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-sans text-white shrink-0"
              style={{ backgroundColor: verticalColor }}
            >
              {userInitials}
            </div>
          </div>
        </div>
      </div>

      {/* Linha separadora com cor da vertical */}
      <div className="h-1" style={{ backgroundColor: verticalColor }} />
    </header>
  )
}
