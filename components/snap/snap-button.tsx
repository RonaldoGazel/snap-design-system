"use client"

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * SNAP Button Component
 * 
 * Regras:
 * - Texto: Capitalização normal (ex: "Cancelar", "Remover Vinculação") - NÃO UPPERCASE
 * - Layout interno: justify-between (ícone ESQUERDA, texto alinhado à DIREITA)
 * - Gap mínimo ícone-texto: 12px (gap-3) - botão cresce se necessário
 * - Border-radius: 6px (rounded-[6px])
 * - Gap entre botões: 16px (gap-4)
 * - Largura padrão Modal: 130px fixa (cresce se texto longo)
 * - Largura padrão Card: 110px fixa (cresce se texto longo)
 */

const snapButtonVariants = cva(
  "inline-flex items-center justify-between gap-3 font-sans font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Ação primária (cor da vertical)
        primary: "bg-[#72284b] text-white hover:bg-[#5a1f3c]",
        
        // Ação secundária/cancelar (outline) - usa text-foreground para adaptar ao tema
        secondary: "bg-transparent border border-border-strong text-foreground hover:bg-muted",
        
        // Outline (borda colorida customizável via className)
        outline: "bg-transparent border",
        
        // Ação destrutiva (vermelho coral - para exclusões/remoções críticas)
        destructive: "bg-[#fe473c] text-white hover:bg-[#e03c32]",
        
        // Ação de sucesso (verde)
        success: "bg-[#3f9f76] text-white hover:bg-[#358a66]",
        
        // Ghost (sem fundo)
        ghost: "bg-transparent text-[#b1b3c2] hover:bg-[#2a2b35] hover:text-white",
        
        // Link style
        link: "bg-transparent text-[#72284b] hover:text-[#d4789b] underline-offset-4 hover:underline",
      },
      size: {
        // Para uso em Modais (min-w permite crescer se texto longo)
        modal: "min-w-[130px] px-4 py-2 text-sm rounded-[6px]",
        
        // Para uso em Cards (min-w permite crescer se texto longo)
        card: "min-w-[110px] px-3 py-2 text-xs rounded-[6px]",
        
        // Tamanho padrão (largura mínima para manter layout)
        default: "min-w-[130px] px-4 py-2 text-sm rounded-[6px]",
        
        // Pequeno (para headers, etc)
        sm: "min-w-[110px] px-3 py-1.5 text-xs rounded-[6px]",
        
        // Grande
        lg: "px-6 py-3 text-base rounded-[8px]",
        
        // Ícone apenas
        icon: "w-10 h-10 rounded-[6px] justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface SnapButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof snapButtonVariants> {
  /** Ícone à esquerda do texto */
  icon?: React.ReactNode
}

const SnapButton = forwardRef<HTMLButtonElement, SnapButtonProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    // Se for apenas ícone, centraliza
    const isIconOnly = size === "icon"
    
    return (
      <button
        ref={ref}
        className={cn(snapButtonVariants({ variant, size }), className)}
        {...props}
      >
        {icon && !isIconOnly && <span className="flex-shrink-0">{icon}</span>}
        {isIconOnly ? icon : <span>{children}</span>}
      </button>
    )
  }
)

SnapButton.displayName = "SnapButton"

export { SnapButton, snapButtonVariants }

/**
 * Container para grupo de botões com gap correto
 * 
 * @param align - 'left' para Cards, 'right' para Modais
 */
export function SnapButtonGroup({ 
  children, 
  align = 'right',
  className,
}: { 
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <div 
      className={cn(
        "flex items-center gap-4",
        align === 'right' ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {children}
    </div>
  )
}
