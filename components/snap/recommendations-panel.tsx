"use client"

import { useState } from "react"
import { Eye, PlayCircle, Trash2, ChevronDown, ChevronUp, Users, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Tipos
interface RecommendationAction {
  id: string
  label: string
  onExecute?: () => void
  onDelete?: () => void
}

interface RecommendationEntity {
  id: string
  name: string
  type: 'person' | 'company'
  count: number
  actions: RecommendationAction[]
}

interface RecommendationsPanelProps {
  /** Lista de entidades com recomendações */
  entities: RecommendationEntity[]
  /** Callback ao executar uma ação */
  onActionExecute?: (entityId: string, actionId: string) => void
  /** Callback ao deletar uma ação */
  onActionDelete?: (entityId: string, actionId: string) => void
  /** Classe adicional */
  className?: string
}

/**
 * RecommendationsPanel - Painel de Recomendações do SNAP Graph
 * 
 * Especificações:
 * - Largura: 451px
 * - Border-radius: 12px
 * - Posição: Fixo à direita com margem de 32px
 * - Header: ícone olho (24x18.45px) + gap 16px + título
 * - Accordion: gap 8px entre itens, badge 22x22px
 * - Ações: play verde (#00FF73) 24px, lixeira 16x18px
 */
export function RecommendationsPanel({
  entities,
  onActionExecute,
  onActionDelete,
  className,
}: RecommendationsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    entities.length > 0 ? entities[0].id : null
  )

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div
      className={cn(
        "w-[451px] bg-card-elevated rounded-[12px] p-6 overflow-hidden",
        "border border-border-subtle",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center" style={{ gap: '16px' }}>
        <Eye 
          className="text-[#72284B] flex-shrink-0" 
          style={{ width: '24px', height: '18.45px' }} 
          strokeWidth={2}
        />
        <h2 className="text-lg font-medium text-foreground font-sans">
          Recomendações
        </h2>
      </div>

      {/* Linha separadora */}
      <div className="h-px bg-border-subtle my-5" />

      {/* Lista de Entidades (Accordion) */}
      <div className="flex flex-col" style={{ gap: '8px' }}>
        {entities.map((entity) => (
          <AccordionItem
            key={entity.id}
            entity={entity}
            isExpanded={expandedId === entity.id}
            onToggle={() => toggleExpand(entity.id)}
            onActionExecute={onActionExecute}
            onActionDelete={onActionDelete}
          />
        ))}
      </div>
    </div>
  )
}

// Componente interno: Item do Accordion
interface AccordionItemProps {
  entity: RecommendationEntity
  isExpanded: boolean
  onToggle: () => void
  onActionExecute?: (entityId: string, actionId: string) => void
  onActionDelete?: (entityId: string, actionId: string) => void
}

function AccordionItem({
  entity,
  isExpanded,
  onToggle,
  onActionExecute,
  onActionDelete,
}: AccordionItemProps) {
  const TypeIcon = entity.type === 'person' ? Users : Building2

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden transition-colors duration-200",
        isExpanded ? "bg-[#16191A]" : "bg-[#1e2122]"
      )}
    >
      {/* Header do Item */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center px-4 py-3 transition-colors duration-200",
          "hover:bg-[#373c3f]",
          isExpanded && "bg-[#373c3f]"
        )}
        style={{ gap: '12px' }}
      >
        {/* Badge numérico pequeno (22x22) */}
        <div 
          className="flex-shrink-0 rounded-[6px] flex items-center justify-center bg-[#2a2b35] text-white font-semibold font-sans"
          style={{ width: '22px', height: '22px', fontSize: '11px' }}
        >
          {entity.count > 99 ? '99' : entity.count}
        </div>

        {/* Ícone de tipo */}
        <TypeIcon 
          className="text-foreground flex-shrink-0" 
          style={{ width: '22px', height: '15.37px' }}
          strokeWidth={2}
        />

        {/* Nome da entidade */}
        <span className="flex-1 text-left text-foreground font-sans text-sm truncate">
          {entity.name}
        </span>

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-foreground flex-shrink-0" />
        )}
      </button>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex flex-col" style={{ gap: '15px' }}>
            {entity.actions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onExecute={() => onActionExecute?.(entity.id, action.id)}
                onDelete={() => onActionDelete?.(entity.id, action.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente interno: Item de Ação
interface ActionItemProps {
  action: RecommendationAction
  onExecute?: () => void
  onDelete?: () => void
}

function ActionItem({ action, onExecute, onDelete }: ActionItemProps) {
  return (
    <div className="flex items-center" style={{ gap: '12px' }}>
      {/* Botão Play - círculo com seta */}
      <button
        onClick={onExecute}
        className="flex-shrink-0 hover:scale-110 transition-transform"
        aria-label={`Executar: ${action.label}`}
      >
        <PlayCircle 
          className="text-[#00FF73] fill-[#00FF73]" 
          style={{ width: '24px', height: '24px' }}
          strokeWidth={0}
        />
      </button>

      {/* Label da ação */}
      <span className="flex-1 text-foreground font-sans text-sm font-medium">
        {action.label}
      </span>

      {/* Botão Deletar */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 text-[#5D5B5B] hover:text-[#ff6b6b] transition-colors"
        aria-label={`Remover: ${action.label}`}
      >
        <Trash2 style={{ width: '16px', height: '18px' }} />
      </button>
    </div>
  )
}

// Export para uso externo
export type { RecommendationEntity, RecommendationAction, RecommendationsPanelProps }
