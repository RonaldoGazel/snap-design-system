"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/snap-tokens"

/**
 * SNAP Badge Component
 * Badges para níveis de risco, status e categorias
 */

const snapBadgeVariants = cva(
  "inline-flex items-center justify-center font-sans text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Níveis de Risco (pill)
        "risco-critico": "bg-[#fe473c] text-white",
        "risco-alto": "bg-[#ff9800] text-black",
        "risco-medio": "bg-[#ffc563] text-black",
        "risco-baixo": "bg-[#3f9f76] text-white",
        
        // Status
        "novo": "bg-[#3f9f76] text-white",
        "prioridade-alta": "bg-[#ffc563] text-black",
        "rascunho": "bg-[#898c9d] text-white",
        "interno": "bg-[#676c70] text-white",
        "formalizado": "bg-[#3f9f76] text-white",
        "urgente": "bg-[#fe473c] text-white",
        "sigiloso": "bg-[#fe473c] text-white",
        
        // Categorias
        "preso": "bg-[#72284b] text-white",
        "visitante": "bg-[#00bcd4] text-black",
        "advogado": "bg-[#3f9f76] text-white",
        "familiar": "bg-[#ffc563] text-black",
        "ex-preso": "bg-[#ff9800] text-black",
        
        // Genéricos
        "default": "bg-[#2a2b35] text-[#b1b3c2]",
        "primary": "bg-[#72284b] text-white",
        "success": "bg-[#3f9f76] text-white",
        "warning": "bg-[#ff9800] text-black",
        "error": "bg-[#fe473c] text-white",
        "info": "bg-[#00bcd4] text-black",
      },
      shape: {
        pill: "rounded-full",
        squared: "rounded-md",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "pill",
      size: "default",
    },
  }
)

export interface SnapBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof snapBadgeVariants> {}

export function SnapBadge({
  className,
  variant,
  shape,
  size,
  ...props
}: SnapBadgeProps) {
  return (
    <span
      className={cn(snapBadgeVariants({ variant, shape, size }), className)}
      {...props}
    />
  )
}

// Componentes específicos para conveniência
export function RiskBadge({ 
  level, 
  ...props 
}: { level: 'critico' | 'alto' | 'medio' | 'baixo' } & Omit<SnapBadgeProps, 'variant'>) {
  const labels = {
    critico: 'Risco Crítico',
    alto: 'Risco Alto',
    medio: 'Risco Médio',
    baixo: 'Risco Baixo',
  }
  
  return (
    <SnapBadge 
      variant={`risco-${level}` as const} 
      shape="pill"
      {...props}
    >
      {labels[level]}
    </SnapBadge>
  )
}

export function StatusBadge({ 
  status, 
  children,
  ...props 
}: { status: 'novo' | 'prioridade-alta' | 'rascunho' | 'interno' | 'formalizado' | 'urgente' | 'sigiloso' } & Omit<SnapBadgeProps, 'variant'>) {
  return (
    <SnapBadge 
      variant={status} 
      shape="pill"
      {...props}
    >
      {children}
    </SnapBadge>
  )
}

export function CategoryTag({ 
  category, 
  children,
  ...props 
}: { category: 'preso' | 'visitante' | 'advogado' | 'familiar' | 'ex-preso' } & Omit<SnapBadgeProps, 'variant'>) {
  return (
    <SnapBadge 
      variant={category} 
      shape="pill"
      {...props}
    >
      {children}
    </SnapBadge>
  )
}
