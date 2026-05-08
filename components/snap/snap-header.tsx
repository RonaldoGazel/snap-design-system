"use client"

import { Bell, Sun, Moon, ChevronRight, Home } from "lucide-react"
import { SnapLogo } from "./snap-logo"
import Link from "next/link"
import { useTheme } from "@/hooks/use-theme"
import { verticals, type Vertical } from "@/lib/snap-tokens"

/**
 * SNAP Header Global
 * 
 * MEDIDAS EXATAS DO FIGMA:
 * - Margem superior (topo até logo SNAP): 32px
 * - Margem inferior (logo SNAP até faixa colorida): 32px
 * - Faixa colorida da vertical: 8px de altura
 * - Gap entre ícone grid e logo SNAP: 70px
 * - Ícone grid: 24x24px
 * - Logo SNAP: 24px de altura
 * 
 * Regras do Breadcrumb:
 * - Primeiro item = Vertical (cor da vertical + ícone casinha + font-medium)
 * - Itens intermediários = #696969 + font-medium
 * - Item atual (último) = text-foreground + font-semibold
 */

// Ícone do Menu de Verticais (grid 3x3) - SVG exato do Figma, 24x24px
function MenuVerticaisIcon({ color = "#505050" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.66667 5.33333C4.1394 5.33333 5.33333 4.1394 5.33333 2.66667C5.33333 1.19391 4.1394 0 2.66667 0C1.19391 0 0 1.19391 0 2.66667C0 4.1394 1.19391 5.33333 2.66667 5.33333Z" fill={color}/>
      <path d="M12 5.33333C13.4727 5.33333 14.6667 4.1394 14.6667 2.66667C14.6667 1.19391 13.4727 0 12 0C10.5273 0 9.33333 1.19391 9.33333 2.66667C9.33333 4.1394 10.5273 5.33333 12 5.33333Z" fill={color}/>
      <path d="M21.3333 5.33333C22.8061 5.33333 24 4.1394 24 2.66667C24 1.19391 22.8061 0 21.3333 0C19.8606 0 18.6667 1.19391 18.6667 2.66667C18.6667 4.1394 19.8606 5.33333 21.3333 5.33333Z" fill={color}/>
      <path d="M2.66667 14.6667C4.1394 14.6667 5.33333 13.4727 5.33333 12C5.33333 10.5273 4.1394 9.33333 2.66667 9.33333C1.19391 9.33333 0 10.5273 0 12C0 13.4727 1.19391 14.6667 2.66667 14.6667Z" fill={color}/>
      <path d="M12 14.6667C13.4727 14.6667 14.6667 13.4727 14.6667 12C14.6667 10.5273 13.4727 9.33333 12 9.33333C10.5273 9.33333 9.33333 10.5273 9.33333 12C9.33333 13.4727 10.5273 14.6667 12 14.6667Z" fill={color}/>
      <path d="M21.3333 14.6667C22.8061 14.6667 24 13.4727 24 12C24 10.5273 22.8061 9.33333 21.3333 9.33333C19.8606 9.33333 18.6667 10.5273 18.6667 12C18.6667 13.4727 19.8606 14.6667 21.3333 14.6667Z" fill={color}/>
      <path d="M2.66667 24C4.1394 24 5.33333 22.8061 5.33333 21.3333C5.33333 19.8606 4.1394 18.6667 2.66667 18.6667C1.19391 18.6667 0 19.8606 0 21.3333C0 22.8061 1.19391 24 2.66667 24Z" fill={color}/>
      <path d="M12 24C13.4727 24 14.6667 22.8061 14.6667 21.3333C14.6667 19.8606 13.4727 18.6667 12 18.6667C10.5273 18.6667 9.33333 19.8606 9.33333 21.3333C9.33333 22.8061 10.5273 24 12 24Z" fill={color}/>
      <path d="M21.3333 24C22.8061 24 24 22.8061 24 21.3333C24 19.8606 22.8061 18.6667 21.3333 18.6667C19.8606 18.6667 18.6667 19.8606 18.6667 21.3333C18.6667 22.8061 19.8606 24 21.3333 24Z" fill={color}/>
    </svg>
  )
}

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  onClick?: () => void
}

interface SnapHeaderProps {
  vertical?: Vertical
  breadcrumb?: BreadcrumbItem[]
  userName?: string
  userRole?: string
  userInitials?: string
  notificationCount?: number
  onAppSwitcherClick?: () => void
}

export function SnapHeader({
  vertical = "administracao",
  breadcrumb = [],
  userName = "Analista de Contrainteligência",
  userRole = "Administrador",
  userInitials = "VD",
  notificationCount = 35,
  onAppSwitcherClick,
}: SnapHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const verticalData = verticals[vertical]
  const verticalColor = verticalData.hex

  return (
    <header className="w-full bg-background" style={{ paddingTop: '26px' }}>
      {/* 
        Container principal do header
        - Margem superior: 32px (aplicada no header via paddingTop)
        - Margem inferior: 24px (elementos até a faixa colorida)
      */}
      <div 
        className="flex items-center justify-between"
        style={{ marginBottom: '24px' }}
      >
        {/* Lado esquerdo: Ícone Grid + Logo + Separador + Breadcrumb */}
        <div className="flex items-center">
          {/* 
            Ícone Menu Verticais (grid 3x3)
            - Tamanho: 24x24px (fixo no SVG)
            - Cor: #505050 (cinza)
            - Margem esquerda: 51px
          */}
          <button
            onClick={onAppSwitcherClick}
            className="hover:opacity-80 transition-opacity"
            aria-label="Abrir menu de aplicativos"
            style={{ marginLeft: '51px', marginTop: '3px', padding: 0, border: 'none', background: 'none' }}
          >
            <MenuVerticaisIcon color="#505050" />
          </button>

          {/* 
            Logo SNAP
            - Gap de 70px entre o ícone e o logo
            - Altura: 24px
            - Clicável: redireciona para /design-system (atalho de debug)
          */}
          <Link 
            href="/design-system" 
            style={{ marginLeft: '70px' }}
            className="hover:opacity-80 transition-opacity"
          >
            <SnapLogo variant="snap" height={24} />
          </Link>

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
              const isClickable = !isLast && (item.href || item.onClick)
              
              const content = (
                <>
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
                    } ${isClickable ? "hover:underline cursor-pointer" : ""}`}
                  >
                    {item.label}
                  </span>
                </>
              )
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#696969]" />
                  {isClickable ? (
                    item.onClick ? (
                      <button onClick={item.onClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        {content}
                      </button>
                    ) : (
                      <Link href={item.href!} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        {content}
                      </Link>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      {content}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Lado direito: Notificações + Tema + Separador + Org + Avatar */}
        {/* Gaps: sininho→sol: 32px, sol→separador: 32px, separador→nome: 32px */}
        <div className="flex items-center" style={{ marginRight: '32px' }}>
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
                  top: '-6px', 
                  right: '-12px', 
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

          {/* Toggle Tema - gap de 32px do sininho */}
          <button
            onClick={toggleTheme}
            className="hover:opacity-80 transition-opacity"
            aria-label={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
            style={{ marginLeft: '32px' }}
          >
            {theme === 'dark' ? (
              <Sun style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            ) : (
              <Moon style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            )}
          </button>

          {/* Separador - gap de 32px do solzinho */}
          <div 
            className="bg-border" 
            style={{ width: '1px', height: '24px', marginLeft: '32px' }} 
          />

          {/* Info Usuário + Avatar - gap de 32px do separador */}
          <div className="flex items-center gap-3" style={{ marginLeft: '32px' }}>
            <div className="text-right">
              <div className="font-sans text-xs text-foreground font-medium">{userName}</div>
              <div className="font-sans text-xs text-text-muted">{userRole}</div>
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

      {/* Faixa colorida da vertical - 8px de altura, começa a 144px da borda esquerda, termina a 32px da borda direita */}
      <div style={{ height: '8px', backgroundColor: verticalColor, marginLeft: '144px', marginRight: '32px' }} />
    </header>
  )
}
