"use client"

import { useTheme } from "@/hooks/use-theme"

interface SnapLogoProps {
  variant?: "snap" | "snap-graph"
  className?: string
  height?: number
}

/**
 * Componente de logo SNAP que alterna automaticamente entre versões dark/light
 * - Dark mode: logos brancos/claros
 * - Light mode: logos escuros (positivo)
 */
export function SnapLogo({ variant = "snap", className, height = 24 }: SnapLogoProps) {
  const { theme } = useTheme()
  
  const logoSrc = variant === "snap-graph"
    ? theme === "light" 
      ? "/assets/snap-graph-logo-light.svg"
      : "/assets/snap-graph-logo.svg"
    : theme === "light"
      ? "/assets/snap-logo-light.svg"
      : "/assets/snap-logo.svg"
  
  const altText = variant === "snap-graph" ? "SNAP Graph" : "SNAP"
  
  return (
    <img 
      src={logoSrc} 
      alt={altText} 
      className={className}
      style={{ height: `${height}px` }}
    />
  )
}
