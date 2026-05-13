"use client"

import Link from "next/link"
import { Users, FolderKey, Shield, Mail, FileSearch, Building2, FileText, ChevronRight } from "lucide-react"
import { SnapThemeToggle } from "@/components/snap/snap-theme-toggle"

/**
 * DOCUMENTACAO - Modulo Administracao (Nivel 2)
 * 
 * Esta pagina e DOCUMENTACAO, nao uma tela real.
 * Estrutura simples, sem sidebar, sem SnapHeader.
 * Links para telas reais abrem em nova janela.
 */

type TelaStatus = "pronto" | "em-desenvolvimento" | "pendente"

interface Tela {
  id: string
  nome: string
  descricao: string
  icon: React.ComponentType<{ className?: string }>
  status: TelaStatus
  href: string
}

const telas: Tela[] = [
  {
    id: "usuarios",
    nome: "Usuarios",
    descricao: "Listagem, detalhe e gerenciamento de usuarios",
    icon: Users,
    status: "pronto",
    href: "/design-system/administracao/usuarios",
  },
  {
    id: "grupos",
    nome: "Grupos",
    descricao: "Organizacao de usuarios em grupos",
    icon: FolderKey,
    status: "pronto",
    href: "/design-system/administracao/grupos",
  },
  {
    id: "papeis",
    nome: "Papeis",
    descricao: "Definicao de papeis e permissoes",
    icon: Shield,
    status: "pendente",
    href: "/design-system/administracao/papeis",
  },
  {
    id: "convites",
    nome: "Convites",
    descricao: "Envio e gerenciamento de convites",
    icon: Mail,
    status: "pendente",
    href: "/design-system/administracao/convites",
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    descricao: "Logs de acoes e auditoria do sistema",
    icon: FileSearch,
    status: "pendente",
    href: "/design-system/administracao/auditoria",
  },
  {
    id: "organizacoes",
    nome: "Organizacoes",
    descricao: "Gerenciamento de organizacoes",
    icon: Building2,
    status: "pendente",
    href: "/design-system/administracao/organizacoes",
  },
  {
    id: "documentos",
    nome: "Documentos",
    descricao: "Documentos administrativos",
    icon: FileText,
    status: "pendente",
    href: "/design-system/administracao/documentos",
  },
]

const statusConfig: Record<TelaStatus, { label: string; bg: string; text: string }> = {
  "pronto": {
    label: "Pronto",
    bg: "bg-success",
    text: "text-white",
  },
  "em-desenvolvimento": {
    label: "Em desenvolvimento",
    bg: "bg-[#333540]",
    text: "text-white",
  },
  "pendente": {
    label: "Pendente",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
}

export default function AdministracaoDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header da Documentacao - padronizado niveis 1 e 2 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Linha 1: Titulo + Theme Toggle */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-title text-2xl text-foreground tracking-wide">SNAP DESIGN SYSTEM</h1>
            <SnapThemeToggle />
          </div>
          
          {/* Linha 2: Breadcrumb + Links Verticais */}
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm font-sans">
              <Link href="/design-system" className="text-text-secondary hover:text-foreground transition-colors">
                Design System
              </Link>
              <ChevronRight className="w-4 h-4 text-text-muted" />
              <span className="text-foreground font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#333540]" />
                Administracao
              </span>
            </nav>
            
            {/* Links das Verticais */}
            <nav className="flex items-center gap-4">
              <Link href="/design-system/investigacao" className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-[#FE473C] transition-colors">
                <div className="w-3 h-3 rounded-full bg-[#FE473C]" />
                <span>Investigacao</span>
              </Link>
              <Link href="/design-system/inteligencia" className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-[#72284B] transition-colors">
                <div className="w-3 h-3 rounded-full bg-[#72284B]" />
                <span>Inteligencia</span>
              </Link>
              <Link href="/design-system/cooperacao" className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-[#889EA3] transition-colors">
                <div className="w-3 h-3 rounded-full bg-[#889EA3]" />
                <span>Cooperacao</span>
              </Link>
              <Link href="/design-system/infraestrutura" className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-[#287266] transition-colors">
                <div className="w-3 h-3 rounded-full bg-[#287266]" />
                <span>Infraestrutura</span>
              </Link>
              <Link href="/design-system/administracao" className="flex items-center gap-2 text-sm font-sans text-[#333540] font-medium">
                <div className="w-3 h-3 rounded-full bg-[#333540]" />
                <span>Administracao</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Descricao */}
        <div className="mb-8">
          <p className="font-sans text-text-secondary">
            Telas do modulo de Administracao. Clique em uma tela para visualiza-la.
          </p>
        </div>

        {/* Grid de telas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {telas.map((tela) => {
            const Icon = tela.icon
            const status = statusConfig[tela.status]
            const isClickable = tela.status !== "pendente"
            
            const CardContent = (
              <>
                {/* Icone e Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#333540]/10 border border-[#333540]/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#333540] dark:text-[#889EA3]" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-sans font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>
                
                {/* Nome e Descricao */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-sans font-semibold text-foreground mb-1">
                      {tela.nome}
                    </h3>
                    <p className="font-sans text-sm text-text-muted">
                      {tela.descricao}
                    </p>
                  </div>
                  {isClickable && (
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              </>
            )
            
            if (isClickable) {
              return (
                <Link
                  key={tela.id}
                  href={tela.href}
                  className="block p-6 rounded-lg border border-border bg-card hover:bg-card-hover hover:border-[#333540]/50 transition-all"
                >
                  {CardContent}
                </Link>
              )
            }
            
            return (
              <div
                key={tela.id}
                className="p-6 rounded-lg border border-border bg-card opacity-50 cursor-not-allowed"
              >
                {CardContent}
              </div>
            )
          })}
        </div>

        {/* Info da vertical */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-4 text-sm font-sans">
            <span className="text-text-muted">Vertical:</span>
            <span className="text-foreground font-medium">Administracao</span>
            <span className="w-px h-4 bg-border" />
            <span className="text-text-muted">Cor:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#333540]" />
              <span className="text-foreground font-mono">#333540</span>
            </div>
            <span className="w-px h-4 bg-border" />
            <span className="text-text-muted">Progresso:</span>
            <span className="text-foreground">1 de 7 telas</span>
          </div>
        </div>
      </main>
    </div>
  )
}
