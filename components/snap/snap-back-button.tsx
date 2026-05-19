"use client"

import { forwardRef } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * SnapBackButton - Botão circular de voltar para telas de detalhe
 * 
 * PADRÃO OBRIGATÓRIO:
 * - Tamanho: w-8 h-8 (32x32px)
 * - Borda: border border-border (1px, cor do tema)
 * - Ícone: ChevronLeft w-5 h-5 text-text-secondary
 * - Hover: bg-muted
 * - Usar em TODAS as telas de detalhe (usuários, grupos, etc.)
 */

interface SnapBackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Função executada ao clicar (navegar de volta) */
  onBack?: () => void
}

const SnapBackButton = forwardRef<HTMLButtonElement, SnapBackButtonProps>(
  ({ className, onClick, onBack, title = "Voltar", ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onBack) {
        onBack()
      }
      if (onClick) {
        onClick(e)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        title={title}
        className={cn(
          // Tamanho fixo: 32x32px (w-8 h-8)
          "w-8 h-8",
          // Formato circular
          "rounded-full",
          // Borda fina
          "border border-border",
          // Layout
          "flex items-center justify-center",
          // Hover
          "hover:bg-muted transition-colors",
          className
        )}
        {...props}
      >
        {/* Ícone: 20x20px (w-5 h-5), cor secundária */}
        <ChevronLeft className="w-5 h-5 text-text-secondary" />
      </button>
    )
  }
)

SnapBackButton.displayName = "SnapBackButton"

export { SnapBackButton }
