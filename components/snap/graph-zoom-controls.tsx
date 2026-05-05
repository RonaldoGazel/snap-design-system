"use client"

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphZoomControlsProps {
  /** Callback ao clicar em Zoom In */
  onZoomIn?: () => void
  /** Callback ao clicar em Zoom Out */
  onZoomOut?: () => void
  /** Callback ao clicar em Ajustar/Fit */
  onFit?: () => void
  /** Classe adicional */
  className?: string
}

/**
 * GraphZoomControls - Console de navegação do SNAP Graph
 * 
 * Especificações:
 * - Ícones: 20px cada
 * - Gap entre ícones: 24px
 * - Hover: branco puro
 * - Sem box ao redor (ícones soltos)
 * - Posicionado 36px abaixo da sidebar
 * - Centralizado com a sidebar (largura 64px)
 */
export function GraphZoomControls({
  onZoomIn,
  onZoomOut,
  onFit,
  className,
}: GraphZoomControlsProps) {
  const buttonClasses = cn(
    "flex items-center justify-center",
    "text-[#696969] hover:text-white transition-colors cursor-pointer"
  )

  return (
    <div
      className={cn(
        "w-[64px] flex flex-col items-center", // mesma largura da sidebar para centralizar
        className
      )}
      style={{ gap: '24px' }}
    >
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className={buttonClasses}
        aria-label="Zoom in"
      >
        <ZoomIn className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className={buttonClasses}
        aria-label="Zoom out"
      >
        <ZoomOut className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Fit/Ajustar */}
      <button
        onClick={onFit}
        className={buttonClasses}
        aria-label="Ajustar visualização"
      >
        <Maximize2 className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  )
}
