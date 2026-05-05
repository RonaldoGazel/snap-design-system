"use client"

import { Eye, Plus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphSidebarProps {
  /** Número de recomendações (badge no ícone do olho) */
  recommendationsCount?: number
  /** Callback ao clicar em Recomendações */
  onRecommendationsClick?: () => void
  /** Callback ao clicar em Adicionar */
  onAddClick?: () => void
  /** Callback ao clicar em Opções (futuro modal) */
  onOptionsClick?: () => void
  /** Classe adicional */
  className?: string
  /** Cor do badge (herda da vertical ativa) */
  badgeColor?: string
}

/**
 * GraphSidebar - Menu principal da interface SNAP Graph
 * 
 * Especificações:
 * - Largura: 64px
 * - Border-radius: 12px
 * - Gap entre ícones: 24px
 * - Badge: 32px de diâmetro
 * - Background: segue padrão do design system (card-elevated)
 */
export function GraphSidebar({
  recommendationsCount = 0,
  onRecommendationsClick,
  onAddClick,
  onOptionsClick,
  className,
  badgeColor = "#72284B", // Default: Inteligência
}: GraphSidebarProps) {
  return (
    <div
      className={cn(
        "w-[64px] bg-card-elevated rounded-[12px] flex flex-col items-center py-4",
        "border border-border-subtle",
        className
      )}
    >
      {/* Ícone Recomendações (Olho) com Badge */}
      <button
        onClick={onRecommendationsClick}
        className="relative w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors"
        aria-label="Recomendações"
      >
        <Eye className="w-6 h-6" strokeWidth={2} />
        
        {/* Badge numérico - 32px, posicionado no canto superior direito */}
        {recommendationsCount > 0 && (
          <span
            className="absolute -top-2 -right-2 w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-sm font-bold font-sans"
            style={{ backgroundColor: badgeColor }}
          >
            {recommendationsCount > 99 ? "99+" : recommendationsCount}
          </span>
        )}
      </button>

      {/* Gap de 24px */}
      <div className="h-6" />

      {/* Ícone Adicionar */}
      <button
        onClick={onAddClick}
        className="w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors"
        aria-label="Adicionar entidade"
      >
        <Plus className="w-6 h-6" strokeWidth={2} />
      </button>

      {/* Gap de 24px */}
      <div className="h-6" />

      {/* Ícone Opções (inativo por enquanto) */}
      <button
        onClick={onOptionsClick}
        className="w-10 h-10 flex items-center justify-center text-[#696969] hover:text-white/80 transition-colors"
        aria-label="Opções"
        disabled={!onOptionsClick}
      >
        <Settings className="w-6 h-6" strokeWidth={2} />
      </button>
    </div>
  )
}
