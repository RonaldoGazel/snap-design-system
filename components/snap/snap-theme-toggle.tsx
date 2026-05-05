"use client"

import { useTheme } from '@/hooks/use-theme'
import { Sun, Moon } from 'lucide-react'

/**
 * SNAP Theme Toggle
 * 
 * Botão para alternar entre light e dark mode.
 * Segue regras de botões: rounded-[6px], hover states.
 * 
 * Ícones:
 * - Sol: Light mode ativo
 * - Lua: Dark mode ativo
 */
export function SnapThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  // Evita hydration mismatch
  if (!mounted) {
    return (
      <button 
        className="p-1.5 rounded-[6px] hover:bg-muted transition-colors"
        aria-label="Alternar tema"
      >
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button 
      onClick={toggleTheme}
      className="p-1.5 rounded-[6px] hover:bg-muted transition-colors"
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-text-muted" />
      ) : (
        <Moon className="w-5 h-5 text-text-muted" />
      )}
    </button>
  )
}

/**
 * Versão compacta para headers com espaço limitado
 */
export function SnapThemeToggleCompact() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div className="w-5 h-5" />
  }

  return (
    <button 
      onClick={toggleTheme}
      className="p-1 rounded-[6px] hover:bg-muted transition-colors"
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-text-muted" />
      ) : (
        <Moon className="w-4 h-4 text-text-muted" />
      )}
    </button>
  )
}
