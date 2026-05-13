"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Shield,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
  Settings,
  ClipboardList,
  Building,
  UsersRound,
  Mail,
  Users,
  X,
  Check,
  ChevronLeft,
  Trash2,
  Search,
  Pencil,
  Clock,
  AlertTriangle
} from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapButton } from "@/components/snap/snap-button"
import { SnapSelect } from "@/components/snap/snap-select"
import { SnapBackButton } from "@/components/snap/snap-back-button"
import { 
  SnapModal, 
  SnapModalHeader, 
  SnapModalContent, 
  SnapModalFooter 
} from "@/components/snap/snap-modal"

/**
 * TELA: Detalhe do Grupo
 * Vertical: Administração (#333540)
 * 
 * ESTRUTURA COPIADA EXATAMENTE DE grupos/page.tsx (PADRÃO OURO)
 * - SnapHeader com breadcrumb incluindo ID do grupo
 * - Sidebar IDÊNTICA (sem font-title em textos < 18px!)
 * - Seta circular de voltar (padrão de tela de detalhes)
 * - Tabela de membros com altura 48px por linha
 */

const VERTICAL_COLOR = "#333540" // Deep Gray Blue - Administração

// Ícone de Link (corrente)
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

// Ícone de Share
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

// Dados mockados para membros do grupo
const mockMembros = [
  { id: "1", nome: "admin", email: "admin@snap.local" },
  { id: "2", nome: "João Silva", email: "joao.silva@snap.local" },
  { id: "3", nome: "Maria Santos", email: "maria.santos@snap.local" },
]

// Grupos disponíveis para seleção de Grupo Pai
const gruposDisponiveis = [
  { value: "nenhum", label: "Nenhum (grupo raiz)" },
  { value: "diretoria", label: "Diretoria Geral" },
  { value: "analistas", label: "Analistas" },
  { value: "operadores", label: "Operadores" },
  { value: "supervisores", label: "Supervisores" }
]

// Dados do grupo (mockado)
const grupoData = {
  nome: "Diretoria Geral",
  criadoEm: "May 12, 2026, 6:38:00 PM",
  atualizadoEm: "May 12, 2026, 6:38:00 PM"
}

export default function GrupoDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  
  // Estado da sidebar - IDÊNTICO a grupos/page.tsx
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarContentVisible, setSidebarContentVisible] = useState(false)
  const [inteligenciaExpanded, setInteligenciaExpanded] = useState(false)
  const [administracaoExpanded, setAdministracaoExpanded] = useState(true)
  
  // Estado do formulário
  const [nomeGrupo, setNomeGrupo] = useState("Diretoria Geral")
  const [grupoPai, setGrupoPai] = useState("nenhum")
  const [buscaMembro, setBuscaMembro] = useState("")
  
  // Modais
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{id: string, nome: string, email: string} | null>(null)
  
  // Filtrar membros
  const membrosFiltrados = mockMembros.filter(m => 
    m.nome.toLowerCase().includes(buscaMembro.toLowerCase()) ||
    m.email.toLowerCase().includes(buscaMembro.toLowerCase())
  )

  // Handlers da sidebar - IDÊNTICO a grupos/page.tsx
  const handleSidebarOpen = () => {
    setSidebarOpen(true)
    setTimeout(() => setSidebarContentVisible(true), 100)
  }

  const handleSidebarClose = () => {
    setSidebarContentVisible(false)
    setTimeout(() => setSidebarOpen(false), 100)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ============================================
          HEADER: SnapHeader padrão - NÃO MEXER
          ============================================ */}
      <SnapHeader
        vertical="administracao"
        breadcrumb={[
          { label: "Grupos", href: "/design-system/administracao/grupos" },
          { label: params.id }
        ]}
        userName="Analista de Contrainteligência"
        userRole="Administrador"
        userInitials="VD"
        notificationCount={35}
      />

      {/* ============================================
          LAYOUT: SIDEBAR + CONTEÚDO
          Medidas EXATAS copiadas de grupos/page.tsx
          ============================================ */}
      <div className="flex flex-1">
        {/* ============================================
            SIDEBAR - COPIADA EXATAMENTE DE grupos/page.tsx
            NÃO USAR font-title em textos < 18px!
            ============================================ */}
        <aside 
          onMouseEnter={handleSidebarOpen}
          onMouseLeave={handleSidebarClose}
          className="flex flex-col py-4 transition-all duration-300 absolute z-50 border border-border rounded-xl bg-card dark:bg-[#101010]"
          style={{ 
            top: '90px',
            marginLeft: '32px',
            width: sidebarOpen ? '280px' : '64px',
            minWidth: sidebarOpen ? '280px' : '64px',
            height: 'calc(100vh - 230px)',
            boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.25)' : 'none'
          }}
        >
          {/* Sidebar Fechada */}
          {!sidebarOpen && (
            <>
              <nav className="flex-1 flex flex-col items-center gap-2">
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <Shield className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: VERTICAL_COLOR }}>
                  <Lock className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <FileText className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <LinkIcon className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <ShareIcon className="w-5 h-5" />
                </button>
              </nav>
              <div className="w-8 mx-auto my-2 border-t border-border" />
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity mx-auto text-muted-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Sidebar Aberta - IDÊNTICA a grupos/page.tsx */}
          {sidebarOpen && sidebarContentVisible && (
            <div className="flex flex-col h-full animate-in fade-in duration-150">
              {/* Vertical: Inteligência */}
              <div className="mb-2">
                <button 
                  onClick={() => setInteligenciaExpanded(!inteligenciaExpanded)}
                  className="w-full flex items-center justify-between py-3 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ paddingLeft: '10px', paddingRight: '16px' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 flex justify-center">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {/* REGRA: font-sans para textos < 18px */}
                    <span className="font-sans text-sm font-medium text-muted-foreground">Inteligência</span>
                  </div>
                  {inteligenciaExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {inteligenciaExpanded && (
                  <div className="mt-1 space-y-1" style={{ paddingLeft: '54px', paddingRight: '12px' }}>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <UsersRound className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Pessoas</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Documentos</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Fluxos de Trabalho</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Vertical: Administração - ATIVA */}
              <div className="mb-2">
                <button 
                  onClick={() => setAdministracaoExpanded(!administracaoExpanded)}
                  className="w-full flex items-center justify-between py-3 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ paddingLeft: '10px', paddingRight: '16px' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 flex justify-center">
                      <Lock className="w-5 h-5" style={{ color: VERTICAL_COLOR }} />
                    </div>
                    {/* REGRA: font-sans para textos < 18px */}
                    <span className="font-sans text-sm font-medium" style={{ color: VERTICAL_COLOR }}>Administração</span>
                  </div>
                  {administracaoExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {administracaoExpanded && (
                  <div className="mt-1 space-y-1" style={{ paddingLeft: '54px', paddingRight: '12px' }}>
                    <Link href="/design-system/administracao/usuarios" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Usuários</span>
                    </Link>
                    {/* Grupos - PÁGINA ATUAL = fundo da cor da vertical */}
                    <Link href="/design-system/administracao/grupos" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: VERTICAL_COLOR }}>
                      <UsersRound className="w-4 h-4 text-white" />
                      <span className="font-sans text-sm text-white">Grupos</span>
                    </Link>
                    <Link href="/design-system/administracao/papeis" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Papéis</span>
                    </Link>
                    <Link href="/design-system/administracao/convites" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Convites</span>
                    </Link>
                    <Link href="/design-system/administracao/auditoria" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Auditoria</span>
                    </Link>
                    <Link href="/design-system/administracao/organizacoes" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Organizações</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex-1" />
              <div className="mx-3 my-2 border-t border-border" />
              <button 
                className="flex items-center gap-3 py-3 rounded-lg hover:bg-muted transition-colors"
                style={{ paddingLeft: '10px' }}
              >
                <div className="w-11 flex justify-center">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-sans text-sm text-muted-foreground">Configurações</span>
              </button>
            </div>
          )}
        </aside>

        {/* ============================================
            ÁREA DE CONTEÚDO - MIOLO
            marginLeft: 128px (32 + 64 + 32)
            ============================================ */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 32}px` }}>
          
          {/* Título com seta circular de voltar - usando SnapBackButton padronizado */}
          <div className="flex items-center gap-3 mb-6">
            <SnapBackButton 
              onBack={() => router.push('/design-system/administracao/grupos')}
              title="Voltar para lista de grupos"
            />
            {/* REGRA: font-title SÓ para textos >= 18px (text-2xl = 24px, OK!) */}
            <h1 className="font-title text-2xl text-foreground">DETALHE DO GRUPO</h1>
          </div>

          {/* Alerta informativo - cor Infraestrutura para destaque */}
          <div className="mb-6 p-4 rounded-xl border border-[#287266]/50 bg-[#287266]/10">
            <p className="font-sans text-sm text-[#4ECDC4]">
              Membros deste grupo compartilham acesso ao mesmo compartimento de dados.
            </p>
          </div>

          {/* ============================================
              CARD HORIZONTAL DE DADOS - PADRÃO DE DETALHES
              Igual ao card de detalhes do usuário
              ============================================ */}
          <div className="bg-card dark:bg-[#101010] rounded-xl border border-border mb-6">
            <div className="flex items-start p-6">
              {/* Nome */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">Nome</label>
                <span className="block font-sans text-base text-foreground font-semibold">{grupoData.nome}</span>
              </div>
              
              {/* Separador vertical */}
              <div className="w-px h-12 bg-border mx-6" />
              
              {/* Criado em */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">Criado em</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="font-sans text-base text-foreground">{grupoData.criadoEm}</span>
                </div>
              </div>
              
              {/* Separador vertical */}
              <div className="w-px h-12 bg-border mx-6" />
              
              {/* Atualizado em */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">Atualizado em</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="font-sans text-base text-foreground">{grupoData.atualizadoEm}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================
              BOTÕES DE AÇÃO - FORA DO CARD
              Padrão de detalhes do usuário
              ============================================ */}
          <div className="flex items-center gap-4 mb-8">
            <SnapButton 
              variant="outline" 
              size="default" 
              icon={<Pencil className="w-4 h-4" />} 
              className="border-success text-success hover:bg-success/10"
              onClick={() => setShowEditModal(true)}
            >Editar</SnapButton>
            <SnapButton 
              variant="primary" 
              size="default" 
              icon={<Trash2 className="w-4 h-4" />} 
              className="bg-error text-white hover:opacity-90"
              onClick={() => setShowDeleteModal(true)}
            >Excluir</SnapButton>
          </div>

          {/* ============================================
              SEÇÃO MEMBROS
              ============================================ */}
          <div>
            {/* Título >= 18px pode usar font-title */}
            <h2 className="font-title text-xl text-foreground mb-4">MEMBROS</h2>
            
            {/* Busca + Botão Adicionar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Buscar usuário..."
                  value={buscaMembro}
                  onChange={(e) => setBuscaMembro(e.target.value)}
                  className="w-[240px] pl-10 pr-4 py-2 rounded-lg border border-border bg-card font-sans text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>
              <SnapButton
                variant="ghost"
                size="default"
                icon={<Plus className="w-4 h-4" />}
              >
                Adicionar Membro
              </SnapButton>
            </div>

            {/* ============================================
                TABELA DE MEMBROS - REGRAS DOCUMENTADAS:
                - Container: rounded-xl border overflow-hidden
                - Table: borderCollapse: collapse
                - Linhas: height: 48px
                - Células: height: 48px, verticalAlign: middle
                - Fontes: font-sans text-sm (NUNCA font-title!)
                ============================================ */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="border-b border-border" style={{ height: "48px" }}>
                    <th className="text-left px-4 text-text-muted font-medium text-sm font-sans" style={{ height: "48px", verticalAlign: "middle" }}>NOME</th>
                    <th className="text-left px-4 text-text-muted font-medium text-sm font-sans" style={{ height: "48px", verticalAlign: "middle" }}>EMAIL</th>
                    <th className="text-left px-4 text-text-muted font-medium text-sm font-sans" style={{ height: "48px", verticalAlign: "middle" }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {membrosFiltrados.map((membro) => (
                    <tr 
                      key={membro.id} 
                      className="border-b border-border last:border-b-0 hover:bg-card-hover transition-colors"
                      style={{ height: "48px" }}
                    >
                      <td className="px-4 text-foreground text-sm font-sans" style={{ height: "48px", verticalAlign: "middle" }}>{membro.nome}</td>
                      <td className="px-4 text-text-secondary text-sm font-sans" style={{ height: "48px", verticalAlign: "middle" }}>{membro.email}</td>
                      <td className="px-4" style={{ height: "48px", verticalAlign: "middle" }}>
                        <SnapButton
                          variant="primary"
                          size="sm"
                          icon={<Trash2 className="w-3 h-3" />}
                          className="!bg-error hover:!bg-error/80"
                          onClick={() => {
                            setSelectedMember(membro)
                            setShowRemoveMemberModal(true)
                          }}
                        >
                          Remover
                        </SnapButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================
          MODAL EDITAR GRUPO
          Estrutura: SnapModalFooter FORA do SnapModalContent
          ============================================ */}
      <SnapModal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <SnapModalHeader 
          icon={<Pencil className="w-5 h-5" style={{ color: VERTICAL_COLOR }} />}
          title="Editar Grupo" 
          onClose={() => setShowEditModal(false)} 
        />
        <SnapModalContent>
          <div className="space-y-4">
            {/* Campo Nome */}
            <div>
              <label className="block font-sans text-sm text-text-muted mb-2">
                Nome
              </label>
              <input 
                type="text"
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-muted font-sans text-sm text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>
            
            {/* Campo Grupo Pai */}
            <SnapSelect
              label="Grupo Pai"
              value={grupoPai}
              onChange={(value) => setGrupoPai(value)}
              options={gruposDisponiveis}
            />
          </div>
        </SnapModalContent>
        <SnapModalFooter>
          <SnapButton
            variant="ghost"
            size="modal"
            icon={<X className="w-4 h-4" />}
            onClick={() => setShowEditModal(false)}
          >
            Cancelar
          </SnapButton>
          <SnapButton
            variant="primary"
            size="modal"
            icon={<Check className="w-4 h-4" />}
            className="!bg-[#333540] hover:!bg-[#252730]"
            onClick={() => setShowEditModal(false)}
          >
            Salvar
          </SnapButton>
        </SnapModalFooter>
      </SnapModal>

      {/* ============================================
          MODAL EXCLUIR GRUPO - ALERTA CRÍTICO DE SISTEMA
          Padrão: ícone atenção + título no header, pergunta em destaque no content
          ============================================ */}
      <SnapModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <SnapModalHeader 
          icon={<AlertTriangle className="w-5 h-5 text-error" />}
          title="Excluir grupo" 
          onClose={() => setShowDeleteModal(false)} 
        />
        <SnapModalContent>
          {/* Pergunta em destaque - font-sans (Inter Tight) + bold + tamanho maior */}
          <p className="font-sans text-lg font-bold text-foreground mb-3">
            Tem certeza que deseja excluir este grupo?
          </p>
          <p className="text-sm font-sans text-text-muted">
            Esta ação será registrada no log de auditoria
          </p>
        </SnapModalContent>
        <SnapModalFooter>
          <SnapButton
            variant="ghost"
            size="modal"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancelar
          </SnapButton>
          <SnapButton
            variant="primary"
            size="modal"
            className="!bg-error text-white hover:opacity-90"
            onClick={() => setShowDeleteModal(false)}
          >
            Excluir
          </SnapButton>
        </SnapModalFooter>
      </SnapModal>

      {/* ============================================
          MODAL REMOVER MEMBRO - ALERTA SIMPLES
          Sem ícone no header, pergunta em destaque (Inter Tight Bold)
          ============================================ */}
      <SnapModal open={showRemoveMemberModal} onClose={() => setShowRemoveMemberModal(false)} size="sm">
        <SnapModalHeader 
          title="Tem certeza que deseja remover este membro?" 
          onClose={() => setShowRemoveMemberModal(false)} 
        />
        <SnapModalContent>
          <p className="text-sm font-sans text-text-muted">
            Esta ação será registrada no log de auditoria
          </p>
        </SnapModalContent>
        <SnapModalFooter>
          <SnapButton
            variant="ghost"
            size="modal"
            onClick={() => setShowRemoveMemberModal(false)}
          >
            Cancelar
          </SnapButton>
          <SnapButton
            variant="primary"
            size="modal"
            className="!bg-error text-white hover:opacity-90"
            onClick={() => setShowRemoveMemberModal(false)}
          >
            Remover
          </SnapButton>
        </SnapModalFooter>
      </SnapModal>
    </div>
  )
}
