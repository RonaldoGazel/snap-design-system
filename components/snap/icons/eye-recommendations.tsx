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
      height="18" 
      viewBox="0 0 24 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Contorno do olho */}
      <path 
        d="M12 2C7 2 2.73 5.11 1 9.5C2.73 13.89 7 17 12 17C17 17 21.27 13.89 23 9.5C21.27 5.11 17 2 12 2Z" 
        stroke="#72284B" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {/* Círculo interno (pupila) */}
      <circle 
        cx="12" 
        cy="9.5" 
        r="3" 
        stroke="#72284B" 
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
