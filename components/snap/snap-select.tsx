"use client"

import { useState, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

/**
 * SNAP Select Component (Estilo Accordion)
 * 
 * Regras:
 * - Expande/contrai suavemente com animação de altura
 * - Seta lateral que rotaciona 90 graus quando aberto
 * - Max-height do dropdown: 160px
 * - Animação: 200ms ease-out
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
  className?: string
}

export const SnapSelect = forwardRef<HTMLDivElement, SnapSelectProps>(
  ({ value, onChange, options, placeholder, label, required, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    const selectedOption = options.find(opt => opt.value === value)

    const handleSelect = (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
    }

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <label className="text-sm text-white mb-2 block font-sans">
            {label} {required && <span className="text-white">*</span>}
          </label>
        )}
        
        <div className="bg-[#000000] border border-border rounded-lg overflow-hidden focus-within:border-white/50">
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-[#b1b3c2] text-sm font-sans">
              {selectedOption?.label || placeholder || "Selecione..."}
            </span>
            <ChevronRight 
              className={cn(
                "w-4 h-4 text-[#898c9d] transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
          </button>
          
          {/* Dropdown (Accordion Style) */}
          <div 
            className={cn(
              "bg-[#0a0a0a] overflow-hidden transition-all duration-200 ease-out",
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
                    "w-full text-left px-4 py-3 text-sm font-sans hover:bg-[#1a1a1a] transition-colors",
                    option.value === value 
                      ? "text-white bg-[#1a1a1a]" 
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
