"use client"

import { useState, forwardRef, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

/**
 * SNAP Select Component - Design System Padronizado
 * 
 * IMPORTANTE: Usa tokens CSS (bg-border, bg-muted, text-text-secondary, etc.)
 * para garantir consistência com o design system e funcionar em light/dark mode.
 * 
 * Copiado EXATAMENTE do modal no design-system/page.tsx:
 * - Trigger: bg-border, hover:bg-muted
 * - Dropdown: bg-muted
 * - Texto normal: text-text-muted
 * - Texto selecionado: text-foreground
 * - Hover nos itens: hover:bg-border
 * - Chevron: text-text-muted, rotate-90 quando aberto
 * 
 * Variantes:
 * - default: largura total, dropdown accordion (para modais/formulários)
 * - inline: largura fixa, dropdown flutuante (para toolbars/páginas)
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
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    const handleSelect = (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
    }

    // Fecha ao clicar fora (para variante inline)
    useEffect(() => {
      if (variant !== 'inline' || !isOpen) return
      
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, variant])

    // Variante INLINE - dropdown flutuante (para toolbars/páginas)
    // Visual IDÊNTICO ao modal, apenas com position absolute no dropdown
    if (variant === 'inline') {
      return (
        <div 
          ref={containerRef}
          className={cn("relative", className)}
          style={{ width: minWidth }}
        >
          {label && (
            <label className="text-sm text-foreground mb-2 block font-sans">
              {label} {required && <span className="text-foreground">*</span>}
            </label>
          )}
          
          {/* Container do select - IGUAL ao modal */}
          <div className="bg-border border border-border rounded-lg overflow-hidden">
            {/* Trigger - IGUAL ao modal */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
            >
              <span className="text-text-secondary text-sm font-sans">
                {selectedOption?.label || placeholder || "Selecione..."}
              </span>
              {/* Chevron - IGUAL ao modal (rotate-90) */}
              <svg
                className={cn(
                  "w-4 h-4 text-text-muted transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Dropdown Flutuante - position absolute para passar por cima do conteúdo */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-0 w-full bg-muted border border-border border-t-0 rounded-b-lg shadow-lg z-50 overflow-hidden">
              <div className="overflow-y-auto max-h-[160px] scrollbar-minimal">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-sans hover:bg-border transition-colors",
                      option.value === value 
                        ? "text-foreground" 
                        : "text-text-muted"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Variante DEFAULT - dropdown accordion (para modais)
    // Código EXATAMENTE igual ao do modal no design-system/page.tsx
    return (
      <div 
        ref={ref} 
        className={cn("w-full", className)}
      >
        {label && (
          <label className="text-sm text-foreground mb-2 block font-sans">
            {label} {required && <span className="text-foreground">*</span>}
          </label>
        )}
        
        {/* Container do select - IGUAL ao modal */}
        <div className="bg-border border border-border rounded-lg overflow-hidden">
          {/* Trigger - IGUAL ao modal */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
          >
            <span className="text-text-secondary text-sm font-sans">
              {selectedOption?.label || placeholder || "Selecione..."}
            </span>
            {/* Chevron - IGUAL ao modal (rotate-90) */}
            <svg
              className={cn(
                "w-4 h-4 text-text-muted transition-transform duration-200",
                isOpen && "rotate-90"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Dropdown estilo Accordion - IGUAL ao modal */}
          <div
            className={cn(
              "bg-muted overflow-hidden transition-all duration-200 ease-out",
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
                    "w-full text-left px-4 py-3 text-sm font-sans hover:bg-border transition-colors",
                    option.value === value 
                      ? "text-foreground" 
                      : "text-text-muted"
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
