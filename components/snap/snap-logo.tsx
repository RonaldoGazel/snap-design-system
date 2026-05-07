"use client"

import { useTheme } from "@/hooks/use-theme"

interface SnapLogoProps {
  variant?: "snap" | "snap-graph"
  className?: string
  height?: number
}

/**
 * Componente de logo SNAP que alterna automaticamente entre versões dark/light
 * - Dark mode: logos brancos/claros (/assets/snap-logo.svg, /assets/snap-graph-logo.svg)
 * - Light mode: logos escuros (/assets/snap-logo-light.svg, /assets/snap-graph-logo-light.svg)
 * 
 * Renderiza ambas versões e usa CSS para mostrar apenas a correta, evitando flash.
 */
export function SnapLogo({ variant = "snap", className, height = 24 }: SnapLogoProps) {
  const darkLogo = variant === "snap-graph" 
    ? "/assets/snap-graph-logo.svg" 
    : "/assets/snap-logo.svg"
  
  const lightLogo = variant === "snap-graph" 
    ? "/assets/snap-graph-logo-light.svg" 
    : "/assets/snap-logo-light.svg"
  
  const altText = variant === "snap-graph" ? "SNAP Graph" : "SNAP"
  
  return (
    <span 
      className={`snap-logo-container ${className || ''}`} 
      style={{ 
        height: `${height}px`, 
        minHeight: `${height}px`, 
        maxHeight: `${height}px`, 
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      {/* Logo para dark mode - visível apenas quando .dark está no html */}
      <img 
        src={darkLogo} 
        alt={altText} 
        className="snap-logo-dark"
        style={{ 
          height: `${height}px`, 
          minHeight: `${height}px`, 
          maxHeight: `${height}px` 
        }}
      />
      {/* Logo para light mode - visível apenas quando .light está no html */}
      <img 
        src={lightLogo} 
        alt={altText} 
        className="snap-logo-light"
        style={{ 
          height: `${height}px`, 
          minHeight: `${height}px`, 
          maxHeight: `${height}px` 
        }}
      />
    </span>
  )
}
