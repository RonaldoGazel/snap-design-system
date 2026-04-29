"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

/**
 * SNAP Card Component
 * 
 * Regras específicas para Cards (diferente de Modais):
 * - Background: #0f0f10
 * - Borda: #2a2b35
 * - Título: Inter (font-sans), 18px, capitalize
 * - Linha separadora: margem horizontal de 20px (mx-5)
 * - Botões: alinhados à ESQUERDA
 * - Margem botões: 24px (mb-6)
 * - Header: pt-4 (16px), pb-3 (12px)
 */

// Card Root
const SnapCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { width?: string }
>(({ className, width = "340px", style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-[#0f0f10] rounded-xl border border-[#2a2b35] overflow-hidden",
      className
    )}
    style={{ width, ...style }}
    {...props}
  />
))
SnapCard.displayName = "SnapCard"

// Card Header
const SnapCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-5 pt-4 pb-3", className)}
    {...props}
  />
))
SnapCardHeader.displayName = "SnapCardHeader"

// Card Title (com ícone)
interface SnapCardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

const SnapCardTitle = forwardRef<HTMLDivElement, SnapCardTitleProps>(
  ({ className, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {icon && <span className="text-[#72284b]">{icon}</span>}
      <span className="font-sans text-[18px] font-medium text-white">
        {children}
      </span>
    </div>
  )
)
SnapCardTitle.displayName = "SnapCardTitle"

// Card Separator (com margem horizontal)
const SnapCardSeparator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mx-5 h-[1px] bg-[#2a2b35]", className)}
    {...props}
  />
))
SnapCardSeparator.displayName = "SnapCardSeparator"

// Card Content
const SnapCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-5", className)}
    {...props}
  />
))
SnapCardContent.displayName = "SnapCardContent"

// Card Highlight Area (área de destaque com fundo escuro)
const SnapCardHighlight = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-[#222222] rounded-lg px-3 py-2 mb-4",
      className
    )}
    {...props}
  />
))
SnapCardHighlight.displayName = "SnapCardHighlight"

// Card Field (label + value)
interface SnapCardFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  labelWidth?: string
}

const SnapCardField = forwardRef<HTMLDivElement, SnapCardFieldProps>(
  ({ className, label, value, labelWidth = "80px", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex", className)}
      {...props}
    >
      <span 
        className="text-white font-bold text-xs font-sans"
        style={{ width: labelWidth }}
      >
        {label}
      </span>
      <span className="text-[#b1b3c2] text-xs font-sans">{value}</span>
    </div>
  )
)
SnapCardField.displayName = "SnapCardField"

// Card Fields Container
const SnapCardFields = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-1 mb-6", className)}
    {...props}
  />
))
SnapCardFields.displayName = "SnapCardFields"

// Card Footer (para botões - alinhados à ESQUERDA)
const SnapCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-start gap-4", className)}
    {...props}
  />
))
SnapCardFooter.displayName = "SnapCardFooter"

export {
  SnapCard,
  SnapCardHeader,
  SnapCardTitle,
  SnapCardSeparator,
  SnapCardContent,
  SnapCardHighlight,
  SnapCardField,
  SnapCardFields,
  SnapCardFooter,
}
