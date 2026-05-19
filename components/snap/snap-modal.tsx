"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

/**
 * SNAP Modal Component
 * 
 * Regras específicas para Modais (diferente de Cards):
 * - Título: Cygnito (font-title), 18px, UPPERCASE
 * - Linha separadora: full-width
 * - Botões: alinhados à DIREITA
 * - Margem botões: 36px (mb-9)
 * - Overlay: #000000 com 80% opacidade
 */

// Modal Overlay
interface SnapModalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

const SnapModalOverlay = forwardRef<HTMLDivElement, SnapModalOverlayProps>(
  ({ className, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4",
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      {...props}
    />
  )
)
SnapModalOverlay.displayName = "SnapModalOverlay"

// Modal Root
interface SnapModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onClose?: () => void
  /** Tamanho do modal: sm (384px), md (448px - default), lg (640px), xl (768px), 2xl (896px) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl'
}

const SnapModal = forwardRef<HTMLDivElement, SnapModalProps>(
  ({ className, open, onClose, size = 'md', children, ...props }, ref) => {
    if (!open) return null
    
    return (
      <SnapModalOverlay onClose={onClose}>
        {/* REGRA: bg-card + dark:bg-[#101010] para garantir cor correta */}
        <div
          ref={ref}
          className={cn(
            "bg-card dark:bg-[#101010] rounded-xl border border-border w-full overflow-hidden z-50",
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </SnapModalOverlay>
    )
  }
)
SnapModal.displayName = "SnapModal"

// Modal Header
interface SnapModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  onClose?: () => void
}

const SnapModalHeader = forwardRef<HTMLDivElement, SnapModalHeaderProps>(
  ({ className, icon, title, onClose, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-primary">{icon}</span>}
            <span className="font-title text-[18px] uppercase text-foreground">{title}</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      {/* Linha separadora full-width */}
      <div className="h-[1px] bg-border" />
    </div>
  )
)
SnapModalHeader.displayName = "SnapModalHeader"

// Modal Content
const SnapModalContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  />
))
SnapModalContent.displayName = "SnapModalContent"

// Modal Footer (para botões - alinhados à DIREITA, com padding)
interface SnapModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se true, adiciona a margem de 36px (mb-9) acima dos botões */
  withTopMargin?: boolean
}

const SnapModalFooter = forwardRef<HTMLDivElement, SnapModalFooterProps>(
  ({ className, withTopMargin = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-4 px-6 pb-6",
        withTopMargin && "mt-9",
        className
      )}
      {...props}
    />
  )
)
SnapModalFooter.displayName = "SnapModalFooter"

// Modal simples (sem portal, para uso inline)
// REGRA: bg-card + dark:bg-[#101010] para garantir cor correta
const SnapModalInline = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card dark:bg-[#101010] rounded-xl border border-border max-w-md overflow-hidden",
      className
    )}
    {...props}
  />
))
SnapModalInline.displayName = "SnapModalInline"

export {
  SnapModal,
  SnapModalOverlay,
  SnapModalHeader,
  SnapModalContent,
  SnapModalFooter,
  SnapModalInline,
}
