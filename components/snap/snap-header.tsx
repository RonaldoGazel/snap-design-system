"use client"

import { Bell, Sun, Moon, ChevronRight, Home } from "lucide-react"
import { SnapLogo } from "./snap-logo"
import { useTheme } from "@/hooks/use-theme"
import { verticals, type Vertical } from "@/lib/snap-tokens"

/**
 * SNAP Header Global
 * 
 * MEDIDAS EXATAS DO FIGMA:
 * - Margem superior: 32px
 * - Margem esquerda do ícone grid: 51px
 * - Tamanho do ícone grid: 24x24px
 * - Gap ícone grid → logo SNAP: 70px
 * 
 * Regras do Breadcrumb:
 * - Primeiro item = Vertical (cor da vertical + ícone casinha + font-medium)
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
  /** Subtítulo da organização */
  organizacaoSubtitulo?: string
  /** Iniciais do usuário para o avatar */
  userInitials?: string
  /** Número de notificações */
  notificationCount?: number
  /** Número secundário (badge ao lado do tema) */
  secondaryBadge?: number
  /** Callback ao clicar no app switcher */
  onAppSwitcherClick?: () => void
}

export function SnapHeader({
  vertical = "administracao",
  breadcrumb = [],
  organizacao = "SEAP - Secretaria da Administração",
  organizacaoSubtitulo = "Penitenciária do Rio de Janeiro",
  userInitials = "VD",
  notificationCount = 35,
  secondaryBadge = 35,
  onAppSwitcherClick,
}: SnapHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const verticalData = verticals[vertical]
  const verticalColor = verticalData.hex

  return (
    <header className="w-full bg-background">
      {/* Barra principal - margem superior 32px */}
      <div 
        className="flex items-center justify-between"
        style={{ marginTop: '32px' }}
      >
        {/* Lado esquerdo: App Switcher + Logo + Separador + Breadcrumb */}
        <div className="flex items-center">
          {/* App Switcher - margem esquerda 51px, ícone 24x24px */}
          <button
            onClick={onAppSwitcherClick}
            className="hover:opacity-80 transition-opacity"
            aria-label="Abrir menu de aplicativos"
            style={{ marginLeft: '51px' }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ 
                width: '24px', 
                height: '24px',
                color: 'var(--text-muted)'
              }}
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
          </button>

          {/* Logo SNAP - gap de 70px do ícone */}
          <div style={{ marginLeft: '70px' }}>
            <SnapLogo variant="snap" height={24} />
          </div>

          {/* Separador vertical */}
          <div 
            className="bg-border" 
            style={{ width: '1px', height: '24px', marginLeft: '24px', marginRight: '24px' }} 
          />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            {/* Item da Vertical (primeiro) */}
            <div className="flex items-center gap-2">
              <Home 
                style={{ width: '16px', height: '16px', color: verticalColor }} 
              />
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

        {/* Lado direito: Notificações + Tema + Badge + Separador + Org + Avatar */}
        <div className="flex items-center gap-4" style={{ marginRight: '32px' }}>
          {/* Notificações */}
          <button
            className="relative hover:opacity-80 transition-opacity"
            aria-label={`${notificationCount} notificações`}
          >
            <Bell style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            {notificationCount > 0 && (
              <span 
                className="absolute flex items-center justify-center text-white font-bold font-sans"
                style={{ 
                  top: '-4px', 
                  right: '-8px', 
                  minWidth: '18px', 
                  height: '18px', 
                  borderRadius: '9px',
                  fontSize: '10px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  backgroundColor: verticalColor 
                }}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Toggle Tema */}
          <button
            onClick={toggleTheme}
            className="hover:opacity-80 transition-opacity"
            aria-label={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? (
              <Sun style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            ) : (
              <Moon style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            )}
          </button>

          {/* Badge secundário */}
          {secondaryBadge !== undefined && (
            <span 
              className="flex items-center justify-center text-white font-bold font-sans"
              style={{ 
                minWidth: '24px', 
                height: '24px', 
                borderRadius: '12px',
                fontSize: '12px',
                paddingLeft: '6px',
                paddingRight: '6px',
                backgroundColor: verticalColor 
              }}
            >
              {secondaryBadge}
            </span>
          )}

          {/* Separador */}
          <div 
            className="bg-border" 
            style={{ width: '1px', height: '24px' }} 
          />

          {/* Info Organização + Avatar */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-sans text-xs text-text-muted">{organizacao}</div>
              <div className="font-sans text-xs text-text-muted">{organizacaoSubtitulo}</div>
            </div>

            {/* Avatar - 32x32px */}
            <div 
              className="flex items-center justify-center text-xs font-bold font-sans text-white shrink-0"
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '16px',
                backgroundColor: verticalColor 
              }}
            >
              {userInitials}
            </div>
          </div>
        </div>
      </div>

      {/* Linha separadora com cor da vertical */}
      <div style={{ height: '4px', marginTop: '16px', backgroundColor: verticalColor }} />
    </header>
  )
}
