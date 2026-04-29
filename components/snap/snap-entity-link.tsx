"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

/**
 * SNAP Entity Link Component
 * 
 * Links por tipo de entidade com cores acessíveis (WCAG AA)
 * Texto clareado + background sutil para melhor legibilidade
 */

const entityStyles = {
  pessoa: {
    text: "text-[#d4789b]",
    bg: "bg-[#72284b]/25",
  },
  endereco: {
    text: "text-[#f0c048]",
    bg: "bg-[#d4a017]/20",
  },
  veiculo: {
    text: "text-[#4dd4e8]",
    bg: "bg-[#00bcd4]/20",
  },
  empresa: {
    text: "text-[#4dd4e8]",
    bg: "bg-[#00bcd4]/20",
  },
} as const

type EntityType = keyof typeof entityStyles

interface SnapEntityLinkProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: EntityType
  href?: string
}

export const SnapEntityLink = forwardRef<HTMLSpanElement, SnapEntityLinkProps>(
  ({ type, className, children, href, ...props }, ref) => {
    const styles = entityStyles[type]
    
    const baseClasses = cn(
      styles.text,
      styles.bg,
      "px-1 rounded font-sans",
      href && "cursor-pointer hover:opacity-80",
      className
    )
    
    if (href) {
      return (
        <a href={href} className={baseClasses}>
          <span ref={ref} {...props}>{children}</span>
        </a>
      )
    }
    
    return (
      <span ref={ref} className={baseClasses} {...props}>
        {children}
      </span>
    )
  }
)

SnapEntityLink.displayName = "SnapEntityLink"

// Componentes específicos para conveniência
export const PessoaLink = forwardRef<
  HTMLSpanElement, 
  Omit<SnapEntityLinkProps, 'type'>
>((props, ref) => <SnapEntityLink ref={ref} type="pessoa" {...props} />)
PessoaLink.displayName = "PessoaLink"

export const EnderecoLink = forwardRef<
  HTMLSpanElement, 
  Omit<SnapEntityLinkProps, 'type'>
>((props, ref) => <SnapEntityLink ref={ref} type="endereco" {...props} />)
EnderecoLink.displayName = "EnderecoLink"

export const VeiculoLink = forwardRef<
  HTMLSpanElement, 
  Omit<SnapEntityLinkProps, 'type'>
>((props, ref) => <SnapEntityLink ref={ref} type="veiculo" {...props} />)
VeiculoLink.displayName = "VeiculoLink"

export const EmpresaLink = forwardRef<
  HTMLSpanElement, 
  Omit<SnapEntityLinkProps, 'type'>
>((props, ref) => <SnapEntityLink ref={ref} type="empresa" {...props} />)
EmpresaLink.displayName = "EmpresaLink"
