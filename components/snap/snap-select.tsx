"use client"

import { useState, forwardRef, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/**
 * SNAP Select Component
 * 
 * Regras:
 * - Chevron sempre alinhado à direita do container (justify-between)
 * - Chevron rotaciona 180 graus quando aberto
 * - Visual consistente com o design system SNAP
 * 
 * Variantes:
 * - default: largura total, dropdown accordion (para modais/formulários)
 * - inline: largura fixa (minWidth), dropdown flutuante (para toolbars/páginas)
 * 
 * Comportamento:
 * - default: dropdown expande no fluxo (accordion), empurra conteúdo
 * - inline: dropdown flutua sobre o conteúdo (position absolute)
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
    // Visual IDÊNTICO ao default, apenas com position absolute no dropdown
    if (variant === 'inline') {
      return (
        <div 
          ref={containerRef}
          className={cn("relative", className)}
          style={{ width: minWidth }}
        >
          {label && (
            <label className="text-sm text-white mb-2 block font-sans">
              {label} {required && <span className="text-white">*</span>}
            </label>
          )}
          
          <div className="bg-[#2a2b35] border border-[#2a2b35] rounded-lg overflow-hidden">
            {/* Trigger */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#3a3b45] transition-colors"
            >
              <span className="text-[#b1b3c2] text-sm font-sans">
                {selectedOption?.label || placeholder || "Selecione..."}
              </span>
              <ChevronDown 
                className={cn(
                  "w-4 h-4 text-[#898c9d] transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          </div>
          
          {/* Dropdown Flutuante - position absolute para passar por cima do conteúdo */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-0 w-full bg-[#1a1b1e] border border-[#2a2b35] rounded-b-lg shadow-lg z-50 overflow-hidden">
              <div className="overflow-y-auto max-h-[200px] scrollbar-minimal">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-sans hover:bg-[#2a2b35] transition-colors",
                      option.value === value 
                        ? "text-white bg-[#2a2b35]" 
                        : "text-[#898c9d]"
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
    return (
      <div 
        ref={ref} 
        className={cn("w-full", className)}
      >
        {label && (
          <label className="text-sm text-white mb-2 block font-sans">
            {label} {required && <span className="text-white">*</span>}
          </label>
        )}
        
        <div className="bg-[#2a2b35] border border-[#2a2b35] rounded-lg overflow-hidden">
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#3a3b45] transition-colors"
          >
            <span className="text-[#b1b3c2] text-sm font-sans">
              {selectedOption?.label || placeholder || "Selecione..."}
            </span>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-[#898c9d] transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
          
          {/* Dropdown Accordion */}
          <div 
            className={cn(
              "bg-[#1a1b1e] overflow-hidden transition-all duration-200 ease-out",
              isOpen ? "max-h-[160px] border-t border-[#2a2b35]" : "max-h-0"
            )}
          >
            <div className="overflow-y-auto max-h-[160px] scrollbar-minimal">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm font-sans hover:bg-[#2a2b35] transition-colors",
                    option.value === value 
                      ? "text-white bg-[#2a2b35]" 
                      : "text-[#898c9d]"
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
