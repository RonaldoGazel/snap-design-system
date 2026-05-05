"use client"

interface EyeRecommendationsIconProps {
  className?: string
}

/**
 * Ícone de olho para o painel de Recomendações
 * Tamanho fixo: 24 x 18.45 pixels
 * Cor: herda via currentColor (usar text-[#72284B])
 */
export function EyeRecommendationsIcon({ className }: EyeRecommendationsIconProps) {
  return (
    <svg 
      width="24" 
      height="19" 
      viewBox="0 0 24 19" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Contorno do olho */}
      <path 
        d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {/* Círculo interno (pupila) */}
      <circle 
        cx="12" 
        cy="11.5" 
        r="3" 
        stroke="currentColor" 
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
