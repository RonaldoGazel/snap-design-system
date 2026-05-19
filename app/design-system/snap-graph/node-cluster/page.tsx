"use client"

import { Building } from "lucide-react"

/**
 * NODE CLUSTER - Componente de Grupo para SNAP Graph
 * 
 * Representa um agrupamento de múltiplas entidades do mesmo tipo.
 * 
 * Características visuais:
 * - Stack de 3 cards (100%, 50%, 30% opacidade) com offset de 10px
 * - Stack de 4 ícones circulares (100%, 70%, 30%, 10% opacidade) com offset de 9px
 * - Texto "Grupo com X entidades" com número em extra-bold
 * - Borda lateral colorida (cor do tipo de entidade)
 * 
 * SUPORTA LIGHT/DARK MODE via variáveis CSS do globals.css
 */

const ENTITY_COLOR = "#FE5722" // Laranja - Company SNAP

export default function NodeClusterPage() {
  return (
    <div className="min-h-screen snap-canvas p-12 flex items-center justify-center">
      {/* Container do Node Cluster */}
      <div className="relative">
        {/* Card 3 - 30% opacidade (mais atrás) - offset 20px */}
        <div 
          className="absolute w-64 rounded-lg border border-canvas-node-border overflow-hidden bg-canvas-node"
          style={{ opacity: 0.30, top: '20px', left: '-20px' }}
        >
          <div className="flex h-full">
            <div className="w-1" style={{ backgroundColor: ENTITY_COLOR }} />
            <div className="flex-1 pt-4 px-4 pb-[18px] invisible">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-base font-sans leading-[1.3]">
                    <span className="font-medium">Grupo com </span>
                    <span className="font-extrabold">58</span>
                    <span className="font-medium"> entidades</span>
                  </p>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-white rounded-full">Company SNAP</span>
                  </div>
                </div>
                <div style={{ width: '44px', height: '44px' }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 2 - 50% opacidade - offset 10px */}
        <div 
          className="absolute w-64 rounded-lg border border-canvas-node-border overflow-hidden bg-canvas-node"
          style={{ opacity: 0.50, top: '10px', left: '-10px' }}
        >
          <div className="flex h-full">
            <div className="w-1" style={{ backgroundColor: ENTITY_COLOR }} />
            <div className="flex-1 pt-4 px-4 pb-[18px] invisible">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-base font-sans leading-[1.3]">
                    <span className="font-medium">Grupo com </span>
                    <span className="font-extrabold">58</span>
                    <span className="font-medium"> entidades</span>
                  </p>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-white rounded-full">Company SNAP</span>
                  </div>
                </div>
                <div style={{ width: '44px', height: '44px' }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Card principal - 100% opacidade (frente) */}
        <div className="relative w-64 rounded-lg overflow-hidden border border-canvas-node-border shadow-sm bg-canvas-node">
          <div className="flex h-full">
            <div className="w-1" style={{ backgroundColor: ENTITY_COLOR }} />
            <div className="flex-1 pt-4 px-4 pb-[18px]">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Texto: "Grupo com X entidades" - número em extra-bold */}
                  <p className="text-foreground text-base font-sans leading-[1.3]">
                    <span className="font-medium">Grupo com </span>
                    <span className="font-extrabold">58</span>
                    <span className="font-medium"> entidades</span>
                  </p>
                  {/* Pill com 16px de distância do texto */}
                  <div className="mt-4">
                    <span 
                      className="inline-block px-3 py-1 text-xs font-sans font-medium text-white rounded-full"
                      style={{ backgroundColor: ENTITY_COLOR }}
                    >
                      Company SNAP
                    </span>
                  </div>
                </div>
                
                {/* Stack de ícones - 4 círculos empilhados */}
                <div className="relative flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                  {/* Ícone 4 - 10% (mais atrás) */}
                  <div 
                    className="absolute w-11 h-11 rounded-full border-[3px] border-[#696969] bg-canvas-node flex items-center justify-center"
                    style={{ opacity: 0.10, top: '27px' }}
                  >
                    <Building className="w-5 h-5 text-[#696969]" />
                  </div>
                  {/* Ícone 3 - 30% */}
                  <div 
                    className="absolute w-11 h-11 rounded-full border-[3px] border-[#696969] bg-canvas-node flex items-center justify-center"
                    style={{ opacity: 0.30, top: '18px' }}
                  >
                    <Building className="w-5 h-5 text-[#696969]" />
                  </div>
                  {/* Ícone 2 - 70% */}
                  <div 
                    className="absolute w-11 h-11 rounded-full border-[3px] border-[#696969] bg-canvas-node flex items-center justify-center"
                    style={{ opacity: 0.70, top: '9px' }}
                  >
                    <Building className="w-5 h-5 text-[#696969]" />
                  </div>
                  {/* Ícone 1 - 100% (frente) */}
                  <div 
                    className="absolute w-11 h-11 rounded-full border-[3px] border-[#696969] bg-canvas-node flex items-center justify-center"
                    style={{ opacity: 1, top: '0px' }}
                  >
                    <Building className="w-5 h-5 text-[#696969]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
