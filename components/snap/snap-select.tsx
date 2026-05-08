"use client"

import { useState, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/**
 * SNAP Select Component (Estilo Accordion)
 * 
 * Regras:
 * - Expande/contrai suavemente com animação de altura
 * - Chevron que rotaciona 180 graus quando aberto
 * - Chevron sempre alinhado à direita do container (justify-between)
 * - Max-height do dropdown: 160px
 * - Animação: 200ms ease-out
 * - Suporta light/dark mode via tokens CSS
 * 
 * Variantes:
 * - default: largura total, para formulários
 * - inline: largura auto (min-w), para uso ao lado de títulos
 */

interface SnapSelectOption {
  value: string
  label: string
}

interface SnapSelectProps {
  value: string
  onChange: (value: string) => void
  options: SnapSelectOption[]
  placeholder?: string
  label?: string
  required?: boolean
  variant?: 'default' | 'inline'
  minWidth?: string
  className?: string
}

export const SnapSelect = forwardRef<HTMLDivElement, SnapSelectProps>(
  ({ value, onChange, options, placeholder, label, required, variant = 'default', minWidth = '180px', className }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    const selectedOption = options.find(opt => opt.value === value)

    const handleSelect = (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
    }

    return (
      <div 
        ref={ref} 
        className={cn(
          variant === 'default' ? 'w-full' : 'relative',
          className
        )}
        style={variant === 'inline' ? { minWidth } : undefined}
      >
        {label && (
          <label className="text-sm text-foreground mb-2 block font-sans">
            {label} {required && <span className="text-foreground">*</span>}
          </label>
        )}
        
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
          >
            <span className="text-muted-foreground text-sm font-sans">
              {selectedOption?.label || placeholder || "Selecione..."}
            </span>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
          
          {/* Dropdown (Accordion Style) */}
          <div 
            className={cn(
              "bg-background overflow-hidden transition-all duration-200 ease-out",
              isOpen ? "max-h-[160px] border-t border-border" : "max-h-0"
            )}
          >
            <div className="overflow-y-auto max-h-[160px] scrollbar-minimal">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm font-sans hover:bg-muted transition-colors",
                    option.value === value 
                      ? "text-foreground bg-muted" 
                      : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

SnapSelect.displayName = "SnapSelect"
