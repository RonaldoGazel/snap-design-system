"use client"

import { type LucideIcon } from "lucide-react"

/**
 * SnapPageTitle - Componente padrao para titulos de pagina de listagem
 * 
 * ESPECIFICACOES (padrao ouro - tela de Usuarios):
 * - Icone: w-8 h-8 (32px), cor da vertical
 * - Gap icone/titulo: gap-3 (12px)
 * - Titulo: font-title text-2xl text-foreground UPPERCASE
 * - Gap titulo/children: gap-6 (24px) - para selects e filtros
 * 
 * USO:
 * ```tsx
 * <SnapPageTitle 
 *   icon={Users} 
 *   title="USUARIOS" 
 *   verticalColor="#333540"
 * >
 *   <Select ... />
 * </SnapPageTitle>
 * ```
 */

interface SnapPageTitleProps {
  /** Icone Lucide a ser exibido */
  icon: LucideIcon
  /** Titulo da pagina (sera exibido em UPPERCASE) */
  title: string
  /** Cor da vertical para o icone */
  verticalColor: string
  /** Elementos adicionais (selects, filtros) - aparecem ao lado do titulo */
  children?: React.ReactNode
  /** Classe adicional para o container */
  className?: string
}

export function SnapPageTitle({
  icon: Icon,
  title,
  verticalColor,
  children,
  className = "",
}: SnapPageTitleProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {/* Icone + Titulo */}
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8" style={{ color: verticalColor }} />
        <h1 className="font-title text-2xl text-foreground">{title.toUpperCase()}</h1>
      </div>
      
      {/* Children: Selects, Filtros, etc */}
      {children}
    </div>
  )
}
