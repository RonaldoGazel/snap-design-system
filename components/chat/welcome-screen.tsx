"use client"

import { Search, FileText, BarChart3, Users, ShieldCheck, Brain } from "lucide-react"

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Search,
    title: "Buscar pessoa",
    description: "Encontre informações sobre uma pessoa na base de dados",
    prompt: "Como posso buscar informações sobre uma pessoa específica no sistema?",
  },
  {
    icon: FileText,
    title: "Gerar relatório",
    description: "Crie relatórios personalizados de monitoramento",
    prompt: "Gere um relatório de monitoramento das últimas 24 horas",
  },
  {
    icon: BarChart3,
    title: "Análise de dados",
    description: "Obtenha insights sobre padrões e tendências",
    prompt: "Analise as tendências de alertas da última semana",
  },
  {
    icon: Users,
    title: "Gestão de pessoas",
    description: "Gerencie cadastros e vínculos do sistema",
    prompt: "Quais são as pendências de cadastro que precisam de revisão?",
  },
]

const quickActions = [
  { icon: ShieldCheck, label: "Verificar alertas", color: "text-destructive" },
  { icon: Brain, label: "Análise preditiva", color: "text-info" },
]

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      {/* Logo and title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
          <span className="text-primary-foreground font-bold text-2xl tracking-wider">
            S
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Como posso ajudar?
        </h1>
        <p className="text-text-secondary text-center max-w-md">
          Sou o assistente de inteligência do SNAP. Posso ajudar com buscas,
          análises e relatórios do sistema.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-card-hover transition-colors text-sm text-foreground"
          >
            <action.icon className={`h-4 w-4 ${action.color}`} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-card-hover hover:border-primary/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <suggestion.icon className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-0.5">
                {suggestion.title}
              </h3>
              <p className="text-xs text-text-muted line-clamp-2">
                {suggestion.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
