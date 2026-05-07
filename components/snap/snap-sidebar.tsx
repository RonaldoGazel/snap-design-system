"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Settings, Search, Home, FileText, BarChart3, Eye, Users, FolderKey, Shield, Mail, FileSearch, Building2, ClipboardList, Globe } from "lucide-react"
import { verticals, type Vertical } from "@/lib/snap-tokens"

/**
 * SNAP Sidebar Global
 * 
 * Estados:
 * - Colapsada: apenas ícones (64px de largura)
 * - Expandida: ícones + texto (240px de largura)
 * 
 * Estrutura:
 * - Verticais com subitens (accordion)
 * - Configurações no rodapé
 * 
 * Regras:
 * - Vertical ativa tem sua cor
 * - Verticais inativas são cinza
 * - Subitem ativo tem fundo destacado
 */

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
}

interface VerticalMenu {
  id: Vertical
  items: MenuItem[]
}

// Configuração dos menus de cada vertical
const verticalMenus: VerticalMenu[] = [
  {
    id: "inteligencia",
    items: [
      { id: "pessoas", label: "Pessoas", icon: <Users className="w-5 h-5" /> },
      { id: "documentos", label: "Documentos", icon: <FileText className="w-5 h-5" /> },
      { id: "analises", label: "Análises", icon: <BarChart3 className="w-5 h-5" /> },
      { id: "busca-geral", label: "Busca Geral", icon: <Search className="w-5 h-5" /> },
      { id: "monitoramento", label: "Monitoramento", icon: <Eye className="w-5 h-5" /> },
    ],
  },
  {
    id: "administracao",
    items: [
      { id: "usuarios", label: "Usuários", icon: <Users className="w-5 h-5" />, href: "/design-system/administracao/usuarios" },
      { id: "grupos", label: "Grupos", icon: <FolderKey className="w-5 h-5" />, href: "/design-system/administracao/grupos" },
      { id: "papeis", label: "Papéis", icon: <Shield className="w-5 h-5" />, href: "/design-system/administracao/papeis" },
      { id: "convites", label: "Convites", icon: <Mail className="w-5 h-5" />, href: "/design-system/administracao/convites" },
      { id: "auditoria", label: "Auditoria", icon: <FileSearch className="w-5 h-5" />, href: "/design-system/administracao/auditoria" },
      { id: "tarefas", label: "Tarefas", icon: <ClipboardList className="w-5 h-5" /> },
      { id: "organizacoes", label: "Organizações", icon: <Building2 className="w-5 h-5" />, href: "/design-system/administracao/organizacoes" },
      { id: "todos-usuarios", label: "Todos os Usuários", icon: <Globe className="w-5 h-5" /> },
    ],
  },
  {
    id: "investigacao",
    items: [
      { id: "casos", label: "Casos", icon: <FileText className="w-5 h-5" /> },
      { id: "alvos", label: "Alvos", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    id: "cooperacao",
    items: [
      { id: "solicitacoes", label: "Solicitações", icon: <FileText className="w-5 h-5" /> },
      { id: "parceiros", label: "Parceiros", icon: <Building2 className="w-5 h-5" /> },
    ],
  },
  {
    id: "infraestrutura",
    items: [
      { id: "servidores", label: "Servidores", icon: <Settings className="w-5 h-5" /> },
      { id: "integrações", label: "Integrações", icon: <Globe className="w-5 h-5" /> },
    ],
  },
]

// Ícones das verticais
const verticalIcons: Record<Vertical, React.ReactNode> = {
  inteligencia: <Search className="w-5 h-5" />,
  administracao: <Home className="w-5 h-5" />,
  investigacao: <FileText className="w-5 h-5" />,
  cooperacao: <Globe className="w-5 h-5" />,
  infraestrutura: <Settings className="w-5 h-5" />,
}

interface SnapSidebarProps {
  /** Sidebar expandida ou colapsada */
  expanded?: boolean
  /** Callback para toggle expand/collapse */
  onToggleExpand?: () => void
  /** Vertical ativa */
  activeVertical?: Vertical
  /** Item ativo dentro da vertical */
  activeItem?: string
  /** Callback ao clicar em um item */
  onItemClick?: (vertical: Vertical, itemId: string, href?: string) => void
  /** Callback ao clicar em configurações */
  onSettingsClick?: () => void
}

export function SnapSidebar({
  expanded = false,
  onToggleExpand,
  activeVertical = "administracao",
  activeItem,
  onItemClick,
  onSettingsClick,
}: SnapSidebarProps) {
  // Verticais expandidas (accordion)
  const [expandedVerticals, setExpandedVerticals] = useState<Vertical[]>([activeVertical])

  const toggleVertical = (vertical: Vertical) => {
    setExpandedVerticals(prev => 
      prev.includes(vertical)
        ? prev.filter(v => v !== vertical)
        : [...prev, vertical]
    )
  }

  const sidebarWidth = expanded ? "w-60" : "w-16"

  return (
    <aside 
      className={`${sidebarWidth} h-full bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-200`}
    >
      {/* Menu de Verticais */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-minimal">
        {verticalMenus.map((menu) => {
          const verticalData = verticals[menu.id]
          const isActive = activeVertical === menu.id
          const isExpanded = expandedVerticals.includes(menu.id)
          const color = isActive ? verticalData.hex : "#696969"

          return (
            <div key={menu.id} className="mb-1">
              {/* Header da Vertical */}
              <button
                onClick={() => {
                  toggleVertical(menu.id)
                  if (!expanded && onToggleExpand) {
                    onToggleExpand()
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-sidebar-accent transition-colors ${
                  expanded ? "justify-between" : "justify-center"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color }}>
                    {verticalIcons[menu.id]}
                  </span>
                  {expanded && (
                    <span 
                      className="font-sans text-sm font-medium truncate"
                      style={{ color }}
                    >
                      {verticalData.name}
                    </span>
                  )}
                </div>
                {expanded && (
                  <span style={{ color }}>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                )}
              </button>

              {/* Subitens (apenas se expandido) */}
              {expanded && isExpanded && (
                <div className="ml-4 border-l border-sidebar-border">
                  {menu.items.map((item) => {
                    const isItemActive = activeVertical === menu.id && activeItem === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => onItemClick?.(menu.id, item.id, item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          isItemActive 
                            ? "bg-sidebar-accent text-foreground" 
                            : "text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <span className={isItemActive ? "text-foreground" : "text-sidebar-foreground/50"}>
                          {item.icon}
                        </span>
                        <span className="font-sans text-sm truncate">
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Separador */}
      <div className="mx-4 border-t border-sidebar-border" />

      {/* Configurações (rodapé) */}
      <div className="p-4">
        <button
          onClick={onSettingsClick}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
            expanded ? "justify-start" : "justify-center"
          }`}
        >
          <Settings className="w-5 h-5 text-sidebar-foreground/70" />
          {expanded && (
            <span className="font-sans text-sm text-sidebar-foreground/70">
              Configurações
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

/**
 * Versão colapsada da sidebar (apenas ícones)
 * Para uso quando a sidebar está minimizada
 */
export function SnapSidebarCollapsed({
  activeVertical = "administracao",
  onVerticalClick,
  onSettingsClick,
}: {
  activeVertical?: Vertical
  onVerticalClick?: (vertical: Vertical) => void
  onSettingsClick?: () => void
}) {
  return (
    <aside className="w-16 h-full bg-sidebar flex flex-col items-center border-r border-sidebar-border py-4">
      {/* Ícones das verticais */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {verticalMenus.map((menu) => {
          const verticalData = verticals[menu.id]
          const isActive = activeVertical === menu.id
          const color = isActive ? verticalData.hex : "#696969"

          return (
            <button
              key={menu.id}
              onClick={() => onVerticalClick?.(menu.id)}
              className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
              title={verticalData.name}
            >
              <span style={{ color }}>
                {verticalIcons[menu.id]}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Separador */}
      <div className="w-8 border-t border-sidebar-border my-2" />

      {/* Configurações */}
      <button
        onClick={onSettingsClick}
        className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
        title="Configurações"
      >
        <Settings className="w-5 h-5 text-sidebar-foreground/70" />
      </button>
    </aside>
  )
}
