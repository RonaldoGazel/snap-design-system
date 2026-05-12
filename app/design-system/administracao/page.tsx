"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, FolderKey, Shield, Mail, FileSearch, Building2, FileText, ChevronRight } from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapSidebar } from "@/components/snap/snap-sidebar"

/**
 * MODULO ADMINISTRACAO - Indice (Nivel 2)
 * 
 * Estrutura: Design System > Administracao > [Paginas]
 * Vertical: Administracao
 * Cor: #333540 (Deep Gray Blue)
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
    status: "pendente",
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

export default function AdministracaoIndexPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <SnapHeader
        vertical="administracao"
        breadcrumb={[
          { label: "Design System", href: "/design-system" },
          { label: "Administracao" }
        ]}
        userName="Designer"
        userRole="Admin"
        userInitials="DS"
        notificationCount={0}
      />

      <div className="flex">
        {/* Sidebar */}
        <SnapSidebar
          vertical="administracao"
          currentPage="administracao"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Conteudo - margem fixa: 32 + 64 + 32 = 128px */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 32}px` }}>
          
          {/* Titulo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#333540] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-title text-2xl text-foreground">ADMINISTRACAO</h1>
            </div>
            <p className="font-sans text-sm text-text-muted">
              Telas do modulo de Administracao: Usuarios, Grupos, Papeis, Convites, Auditoria e Organizacoes
            </p>
          </div>

          {/* Grid de telas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
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
                      <ChevronRight className="w-5 h-5 text-text-muted" />
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

          {/* Info */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="font-sans font-semibold text-foreground mb-2">Sobre este modulo</h2>
            <p className="font-sans text-sm text-text-muted mb-4">
              Telas visuais para implementacao. Design segue o padrao SNAP com a cor da vertical Administracao.
            </p>
            <div className="flex items-center gap-4 text-xs font-sans text-text-muted">
              <span>Vertical: Administracao</span>
              <span className="w-px h-4 bg-border" />
              <span>Cor: #333540</span>
              <span className="w-px h-4 bg-border" />
              <span>Status: 1 de 7 telas prontas</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
