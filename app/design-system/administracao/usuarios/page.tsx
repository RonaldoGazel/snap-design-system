"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Edit2, Trash2, Mail, Shield, Users as UsersIcon } from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapSidebar, SnapSidebarCollapsed } from "@/components/snap/snap-sidebar"
import { SnapButton } from "@/components/snap/snap-button"
import { FileText } from "lucide-react"

/**
 * TELA: Usuários
 * Vertical: Administração (#333540)
 * 
 * Esta é a primeira tela do módulo de Administração.
 * Aguardando imagens do Figma para detalhamento completo.
 * 
 * Estrutura base:
 * - Header global com breadcrumb
 * - Sidebar (colapsada por padrão)
 * - Área principal com tabela de usuários
 * - Modais: criar, editar, excluir usuário
 */

// Dados mockados para a tabela
const mockUsers = [
  { 
    id: 1, 
    nome: "João Silva", 
    email: "joao.silva@org.gov.br", 
    papel: "Administrador", 
    grupo: "TI", 
    status: "Ativo",
    ultimoAcesso: "07/05/2026 14:30"
  },
  { 
    id: 2, 
    nome: "Maria Santos", 
    email: "maria.santos@org.gov.br", 
    papel: "Analista", 
    grupo: "Inteligência", 
    status: "Ativo",
    ultimoAcesso: "07/05/2026 10:15"
  },
  { 
    id: 3, 
    nome: "Pedro Costa", 
    email: "pedro.costa@org.gov.br", 
    papel: "Operador", 
    grupo: "Operações", 
    status: "Inativo",
    ultimoAcesso: "01/05/2026 09:00"
  },
  { 
    id: 4, 
    nome: "Ana Oliveira", 
    email: "ana.oliveira@org.gov.br", 
    papel: "Supervisor", 
    grupo: "Inteligência", 
    status: "Ativo",
    ultimoAcesso: "06/05/2026 18:45"
  },
  { 
    id: 5, 
    nome: "Carlos Ferreira", 
    email: "carlos.ferreira@org.gov.br", 
    papel: "Analista", 
    grupo: "TI", 
    status: "Ativo",
    ultimoAcesso: "07/05/2026 08:20"
  },
]

export default function UsuariosPage() {
  const router = useRouter()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleItemClick = (vertical: string, itemId: string, href?: string) => {
    if (href) {
      router.push(href)
    }
  }

  const filteredUsers = mockUsers.filter(user => 
    user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <SnapHeader
        vertical="administracao"
        breadcrumb={[
          { label: "Usuários", icon: <UsersIcon className="w-4 h-4" /> }
        ]}
        organizacao="Secretaria de Segurança"
        organizacaoSigla="SESP"
        userInitials="JS"
        notificationCount={3}
      />

      {/* Layout principal */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {sidebarExpanded ? (
          <SnapSidebar
            expanded={true}
            activeVertical="administracao"
            activeItem="usuarios"
            onItemClick={handleItemClick}
            onToggleExpand={() => setSidebarExpanded(false)}
          />
        ) : (
          <SnapSidebarCollapsed
            activeVertical="administracao"
            onVerticalClick={() => setSidebarExpanded(true)}
          />
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Cabeçalho da página */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-title mb-1">USUÁRIOS</h1>
              <p className="text-text-secondary font-sans text-sm">
                Gerencie os usuários do sistema
              </p>
            </div>
            
            <SnapButton
              variant="primary"
              size="default"
              icon={<Plus className="w-4 h-4" />}
              className="bg-[#333540] hover:bg-[#252730]"
            >
              Novo Usuário
            </SnapButton>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg font-sans text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#333540]"
              />
            </div>

            {/* Placeholder para filtros adicionais */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted font-sans text-sm">Filtros:</span>
              <select className="bg-input border border-border rounded-lg px-3 py-2 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#333540]">
                <option value="">Todos os papéis</option>
                <option value="admin">Administrador</option>
                <option value="analista">Analista</option>
                <option value="operador">Operador</option>
              </select>
              <select className="bg-input border border-border rounded-lg px-3 py-2 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#333540]">
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header da tabela */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr_auto] gap-4 px-6 py-3 bg-muted border-b border-border">
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Nome</span>
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Email</span>
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Papel</span>
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Grupo</span>
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Status</span>
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Último Acesso</span>
              <span className="font-sans text-xs text-text-muted uppercase tracking-wider">Ações</span>
            </div>

            {/* Linhas da tabela */}
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr_auto] gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-card-hover transition-colors"
              >
                <span className="font-sans text-sm text-foreground font-medium">
                  {user.nome}
                </span>
                <span className="font-sans text-sm text-text-secondary">
                  {user.email}
                </span>
                <span className="font-sans text-sm text-text-secondary">
                  {user.papel}
                </span>
                <span className="font-sans text-sm text-text-secondary">
                  {user.grupo}
                </span>
                <span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-sans ${
                    user.status === "Ativo" 
                      ? "bg-success/20 text-success" 
                      : "bg-muted text-text-muted"
                  }`}>
                    {user.status}
                  </span>
                </span>
                <span className="font-sans text-sm text-text-muted">
                  {user.ultimoAcesso}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-text-muted hover:text-foreground" />
                  </button>
                  <button 
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Enviar convite"
                  >
                    <Mail className="w-4 h-4 text-text-muted hover:text-foreground" />
                  </button>
                  <button 
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-text-muted hover:text-error" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info de paginação (placeholder) */}
          <div className="flex items-center justify-between mt-4 text-sm font-sans text-text-muted">
            <span>Mostrando {filteredUsers.length} de {mockUsers.length} usuários</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border border-border hover:bg-muted transition-colors">
                Anterior
              </button>
              <span className="px-3 py-1">1 de 1</span>
              <button className="px-3 py-1 rounded border border-border hover:bg-muted transition-colors">
                Próximo
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
