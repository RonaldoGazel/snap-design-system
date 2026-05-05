"use client"

import { Eye, Plus, SlidersHorizontal } from "lucide-react"
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
 * - Altura: 144px
 * - Padding interno: 20px
 * - Border-radius: 12px
 * - Gap entre ícones: 24px
 * - Badge: 32px de diâmetro
 * - Ícones: Olho 25x20, Plus 22x22, Sliders 22x21
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
        "w-[64px] h-[144px] bg-card-elevated rounded-[12px] flex flex-col items-center justify-center p-[20px]",
        "border border-border-subtle",
        className
      )}
      style={{ gap: '24px' }}
    >
      {/* Ícone Recomendações (Olho) com Badge - 25x20px */}
      <button
        onClick={onRecommendationsClick}
        className="relative flex items-center justify-center text-white hover:text-white/80 transition-colors"
        aria-label="Recomendações"
      >
        <Eye style={{ width: '25px', height: '20px' }} strokeWidth={2} />
        
        {/* Badge numérico - 32px, posicionado no canto superior direito */}
        {recommendationsCount > 0 && (
          <span
            className="absolute -top-3 -right-4 w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-sm font-bold font-sans"
            style={{ backgroundColor: badgeColor }}
          >
            {recommendationsCount > 99 ? "99+" : recommendationsCount}
          </span>
        )}
      </button>

      {/* Ícone Adicionar - 22x22px */}
      <button
        onClick={onAddClick}
        className="flex items-center justify-center text-white hover:text-white/80 transition-colors"
        aria-label="Adicionar entidade"
      >
        <Plus style={{ width: '22px', height: '22px' }} strokeWidth={2} />
      </button>

      {/* Ícone Configurações (Sliders) - 22x21px - inativo por enquanto */}
      <button
        onClick={onOptionsClick}
        className="flex items-center justify-center text-[#696969] hover:text-white/80 transition-colors"
        aria-label="Opções"
        disabled={!onOptionsClick}
      >
        <SlidersHorizontal style={{ width: '22px', height: '21px' }} strokeWidth={2} />
      </button>
    </div>
  )
}
