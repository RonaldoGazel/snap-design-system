"use client"

import Link from "next/link"
import { Users, FolderKey, Shield, Mail, FileSearch, Building2, FileText, ArrowLeft } from "lucide-react"
import { SnapLogo } from "@/components/snap/snap-logo"
import { SnapThemeToggle } from "@/components/snap/snap-theme-toggle"

/**
 * MÓDULO ADMINISTRAÇÃO - Índice
 * 
 * Vertical: Administração
 * Cor: #333540 (Deep Gray Blue)
 * 
 * Ordem de prioridade:
 * 1. Usuários
 * 2. Grupos
 * 3. Papéis
 * 4. Convites
 * 5. Auditoria
 * 6. Organizações
 * 7. Documentos (depois)
 */

type TelaStatus = "em-desenvolvimento" | "pronto" | "pendente"

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
    nome: "Usuários",
    descricao: "Gerenciamento de usuários do sistema",
    icon: Users,
    status: "em-desenvolvimento",
    href: "/design-system/administracao/usuarios",
  },
  {
    id: "grupos",
    nome: "Grupos",
    descricao: "Organização de usuários em grupos",
    icon: FolderKey,
    status: "pendente",
    href: "/design-system/administracao/grupos",
  },
  {
    id: "papeis",
    nome: "Papéis",
    descricao: "Definição de papéis e permissões",
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
    descricao: "Logs de ações e auditoria do sistema",
    icon: FileSearch,
    status: "pendente",
    href: "/design-system/administracao/auditoria",
  },
  {
    id: "organizacoes",
    nome: "Organizações",
    descricao: "Gerenciamento de organizações",
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
  "em-desenvolvimento": {
    label: "Em desenvolvimento",
    bg: "bg-[#333540]",
    text: "text-white",
  },
  "pronto": {
    label: "Pronto",
    bg: "bg-success",
    text: "text-white",
  },
  "pendente": {
    label: "Pendente",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
}

export default function AdministracaoIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header simples */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/design-system" 
              className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-sans text-sm">Design System</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <SnapLogo variant="snap" height={24} />
          </div>
          <SnapThemeToggle />
        </div>
      </header>

      {/* Barra da vertical */}
      <div className="h-1 bg-[#333540]" />

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#333540] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-title">ADMINISTRAÇÃO</h1>
          </div>
          <p className="text-text-secondary font-sans max-w-2xl">
            Telas do módulo de Administração do SNAP. Cada tela representa uma funcionalidade 
            do sistema de gerenciamento administrativo.
          </p>
        </div>

        {/* Grid de telas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {telas.map((tela) => {
            const Icon = tela.icon
            const status = statusConfig[tela.status]
            const isClickable = tela.status !== "pendente"
            
            const CardContent = (
              <>
                {/* Ícone e Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#333540]/10 border border-[#333540]/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#333540]" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-sans ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>
                
                {/* Nome e Descrição */}
                <h3 className="font-sans font-semibold text-lg text-foreground mb-2">
                  {tela.nome}
                </h3>
                <p className="font-sans text-sm text-text-secondary">
                  {tela.descricao}
                </p>
              </>
            )
            
            if (isClickable) {
              return (
                <Link
                  key={tela.id}
                  href={tela.href}
                  className="block p-6 rounded-xl border border-border bg-card hover:bg-card-hover hover:border-[#333540]/50 transition-all"
                >
                  {CardContent}
                </Link>
              )
            }
            
            return (
              <div
                key={tela.id}
                className="p-6 rounded-xl border border-border bg-card opacity-60 cursor-not-allowed"
              >
                {CardContent}
              </div>
            )
          })}
        </div>

        {/* Info box */}
        <div className="mt-12 p-6 rounded-xl border border-border bg-card">
          <h2 className="font-sans font-semibold text-foreground mb-2">Sobre este módulo</h2>
          <p className="font-sans text-sm text-text-secondary mb-4">
            Estas são telas puramente visuais (sem funcionalidade real) para o Vittor implementar.
            O design segue o padrão do ecossistema SNAP com a cor da vertical Administração (#333540).
          </p>
          <div className="flex items-center gap-4 text-xs font-sans text-text-muted">
            <span>Vertical: Administração</span>
            <span className="w-px h-4 bg-border" />
            <span>Cor: #333540 (Deep Gray Blue)</span>
          </div>
        </div>
      </main>
    </div>
  )
}
