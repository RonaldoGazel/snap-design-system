"use client"

import { cn } from "@/lib/utils"

interface PlayActionIconProps {
  className?: string
  size?: number
}

/**
 * Ícone de Play para ações no painel de recomendações
 * Círculo verde (#00FF73) com seta de play dentro
 */
export function PlayActionIcon({ className, size = 24 }: PlayActionIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 26 26" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      <mask id="mask0_play_action" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="26" height="26">
        <path d="M13 25C19.6276 25 25 19.6276 25 13C25 6.3724 19.6276 1 13 1C6.3724 1 1 6.3724 1 13C1 19.6276 6.3724 25 13 25Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M10.5996 12.9986V8.8418L14.1996 10.9202L17.7996 12.9986L14.1996 15.077L10.5996 17.1554V12.9986Z" fill="black" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
      </mask>
      <g mask="url(#mask0_play_action)">
        <path d="M-1.40039 -1.40039H27.3996V27.3996H-1.40039V-1.40039Z" fill="#00FF73"/>
      </g>
    </svg>
  )
}
