"use client"

import { ArrowLeft } from "lucide-react"

/**
 * SNAP Pagination
 * 
 * Componente de paginação padronizado do Design System SNAP.
 * 
 * ESTRUTURA:
 * - Botão "Página anterior" (esquerda)
 * - Números das páginas (centro)
 * - Botão "Próxima página" (direita)
 * 
 * REGRAS DE EXIBIÇÃO DOS NÚMEROS:
 * - Sempre mostra primeira e última página
 * - Mostra 2 páginas antes e depois da atual
 * - Usa "..." para indicar páginas omitidas
 * - Página atual: bg-muted, font-bold, text-foreground
 * - Demais: text-text-muted
 * 
 * @example
 * <SnapPagination
 *   currentPage={7}
 *   totalPages={25}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 */

interface SnapPaginationProps {
  /** Página atual (1-indexed) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Callback quando a página muda */
  onPageChange: (page: number) => void
  /** Texto do botão anterior (default: "Página anterior") */
  previousLabel?: string
  /** Texto do botão próximo (default: "Próxima página") */
  nextLabel?: string
}

export function SnapPagination({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel = "Página anterior",
  nextLabel = "Próxima página",
}: SnapPaginationProps) {
  
  // Gera array de páginas para exibir
  const getVisiblePages = (): (number | "...")[] => {
    const pages: (number | "...")[] = []
    
    if (totalPages <= 7) {
      // Mostra todas as páginas se forem poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }
    
    // Sempre mostra a primeira página
    pages.push(1)
    
    // Calcula range ao redor da página atual
    const start = Math.max(2, currentPage - 2)
    const end = Math.min(totalPages - 1, currentPage + 2)
    
    // Adiciona ... se houver gap após primeira página
    if (start > 2) {
      pages.push("...")
    }
    
    // Adiciona páginas do range
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // Adiciona ... se houver gap antes da última página
    if (end < totalPages - 1) {
      pages.push("...")
    }
    
    // Sempre mostra a última página
    pages.push(totalPages)
    
    return pages
  }
  
  const visiblePages = getVisiblePages()
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages
  
  return (
    <div className="flex items-center justify-between">
      {/* Botão Página Anterior */}
      <button
        onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-sans transition-colors ${
          canGoPrevious 
            ? "text-text-secondary hover:text-foreground cursor-pointer" 
            : "text-text-muted cursor-not-allowed opacity-50"
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        {previousLabel}
      </button>
      
      {/* Números das Páginas */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => (
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-text-muted">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm font-sans rounded transition-colors ${
                page === currentPage
                  ? "text-foreground font-bold bg-muted"
                  : "text-text-muted hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      {/* Botão Próxima Página */}
      <button
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-sans transition-colors ${
          canGoNext 
            ? "text-text-secondary hover:text-foreground cursor-pointer" 
            : "text-text-muted cursor-not-allowed opacity-50"
        }`}
      >
        {nextLabel}
        <ArrowLeft className="w-4 h-4 rotate-180" />
      </button>
    </div>
  )
}
