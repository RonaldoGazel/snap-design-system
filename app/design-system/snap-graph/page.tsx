'use client'

import Link from 'next/link'
import { ArrowLeft, Building, Car, X, Phone, User, CreditCard, FileText, MapPin, Mail } from 'lucide-react'
import { SnapButton } from '@/components/snap/snap-button'

// Componente Section reutilizável
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')
  return (
    <section id={id} className="mb-16 scroll-mt-8">
      <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border font-sans">
        {title}
      </h2>
      {children}
    </section>
  )
}

// Índice de navegação
const indice = [
  { titulo: 'Visão Geral', id: 'visão-geral' },
  { titulo: 'Canvas e Grid', id: 'canvas-e-grid' },
  { titulo: 'Header', id: 'header' },
  { titulo: 'Entity Nodes', id: 'entity-nodes' },
  { titulo: 'Labels de Categoria', id: 'labels-de-categoria' },
  { titulo: 'Conexões (Edges)', id: 'conexões-edges' },
  { titulo: 'Estados Interativos', id: 'estados-interativos' },
]

export default function SnapGraphDesignSystem() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb de navegação */}
        <nav className="mb-6 flex items-center gap-2 text-sm font-sans">
          <Link href="/design-system" className="text-text-muted hover:text-foreground transition-colors">
            Design System
          </Link>
          <span className="text-text-muted">/</span>
          <Link href="/design-system#aplicativos-derivados" className="text-text-muted hover:text-foreground transition-colors">
            Aplicativos
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-foreground font-medium">SNAP Graph</span>
        </nav>
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <img src="/assets/snap-graph-logo.svg" alt="SNAP Graph" className="h-8" />
            <div className="w-px h-8 bg-border" />
            <span className="text-sm text-text-muted font-sans uppercase tracking-wide">Documentação de Interface</span>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground font-sans">
            SNAP Graph
          </h1>
          <p className="text-lg text-text-secondary mt-2 font-sans">
            Área agnóstica de visualização de grafos do Ecossistema SNAP.
            <br />
            <span className="text-text-muted text-sm">Cor base: #696969 (neutro)</span>
          </p>
        </header>

        {/* Índice */}
        <nav className="mb-12 p-6 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide font-sans">Índice</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {indice.map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-text-secondary hover:text-foreground transition-colors font-sans py-1"
              >
                {item.titulo}
              </a>
            ))}
          </div>
        </nav>

        {/* ============================================
            VISÃO GERAL
            ============================================ */}
        <Section title="Visão Geral">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">O que é o SNAP Graph?</h4>
              <p className="text-sm text-text-secondary font-sans leading-relaxed">
                Ferramenta de visualização de relacionamentos entre entidades (pessoas, empresas, telefones, 
                veículos, etc.) em formato de grafo interativo. Permite análise visual de vínculos e 
                descoberta de padrões em investigações.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Características Técnicas</h4>
              <ul className="text-sm text-text-secondary font-sans space-y-1 list-disc ml-4">
                <li>Canvas infinito com zoom e pan</li>
                <li>Roteamento ortogonal de conexões</li>
                <li>Nodes com largura fixa (256px)</li>
                <li>Grid de fundo pontilhado (bitmap tiling)</li>
                <li>Paleta de cores neutra (#696969 base)</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* ============================================
            CANVAS E GRID
            ============================================ */}
        <Section title="Canvas e Grid">
          <div className="space-y-6">
            {/* Preview do Canvas */}
            <div 
              className="h-64 rounded-xl border border-border overflow-hidden"
              style={{
                backgroundColor: '#0a0a0a',
                backgroundImage: 'url(/assets/snap-graph-grid.png)',
                backgroundRepeat: 'repeat',
              }}
            >
              {/* Exemplo com nodes conectados */}
              <div className="w-full h-full relative p-8">
                {/* Node A - Company */}
                <div className="absolute w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" style={{ left: '80px', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="flex h-full">
                    <div className="w-1 bg-[#7c8db0]" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Techbiz Forense Digital LTDA</p>
                        </div>
                        <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-[#696969]" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Conexão: lateral direita A → lateral esquerda B */}
                <svg className="absolute" style={{ left: '344px', top: '50%', transform: 'translateY(-50%)' }} width="72" height="24">
                  <defs>
                    <marker
                      id="arrow-canvas"
                      markerWidth="12"
                      markerHeight="12"
                      refX="6"
                      refY="6"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0,0 12,6 0,12" fill="#454545" />
                    </marker>
                  </defs>
                  <line x1="0" y1="12" x2="60" y2="12" stroke="#454545" strokeWidth="2" markerEnd="url(#arrow-canvas)" />
                </svg>
                
                {/* Node B - Person */}
                <div className="absolute w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" style={{ left: '416px', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="flex h-full">
                    <div className="w-1 bg-[#9b7fb8]" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Luiz Henrique de Souza Borges</p>
                        </div>
                        <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] overflow-hidden flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&h=88&fit=crop&crop=face" alt="Foto" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e8e0f0] bg-[#5c4a6b] rounded-full">Person SNAP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regras do Canvas */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Especificações do Canvas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary font-sans">
                <div>
                  <p className="font-medium text-foreground mb-1">Background</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Cor base:</strong> #0a0a0a</li>
                    <li><strong>Grid:</strong> bitmap pontilhado (PNG)</li>
                    <li><strong>Arquivo:</strong> /assets/snap-graph-grid.png</li>
                    <li><strong>CSS:</strong> background-repeat: repeat</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Interação</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Zoom:</strong> scroll do mouse ou pinch</li>
                    <li><strong>Pan:</strong> arrastar com mouse ou touch</li>
                    <li><strong>Limite zoom:</strong> 25% a 200%</li>
                    <li><strong>Animação:</strong> ease-out 200ms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================
            HEADER
            ============================================ */}
        <Section title="Header">
          <div className="space-y-6">
            {/* Preview do Header */}
            <div className="bg-[#0a0a0a] rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4">
                {/* Esquerda: Logo + Breadcrumb */}
                <div className="flex items-center gap-4">
                  <img src="/assets/snap-graph-logo.svg" alt="SNAP Graph" className="h-6 mr-4" />
                  <div className="w-px h-6 bg-[#696969] mr-4" />
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-sm font-sans">
                    {/* Vertical: cor da vertical + ícone */}
                    <span className="flex items-center gap-1.5 text-[#72284B] font-medium">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      Inteligência
                    </span>
                    <span className="text-[#454545]">&gt;</span>
                    <span className="text-[#696969] font-medium">Processos/Documentos</span>
                    <span className="text-[#454545]">&gt;</span>
                    {/* Item atual: branco + semibold */}
                    <span className="text-white font-semibold">Relatório de Inteligência</span>
                  </div>
                </div>
                
                {/* Direita: Notificações + Theme + Usuário + Voltar */}
                <div className="flex items-center gap-4">
                  {/* Sino de notificações com badge */}
                  <div className="relative">
                    <svg className="w-5 h-5 text-[#696969]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-[#72284B] text-white text-[10px] font-bold font-sans rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      35
                    </span>
                  </div>
                  
                  {/* Theme toggle */}
                  <button className="p-1.5 rounded-[6px] hover:bg-[#2c2c2c] transition-colors">
                    <svg className="w-5 h-5 text-[#696969]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </button>
                  
                  {/* Separador */}
                  <div className="w-px h-6 bg-[#454545]" />
                  
                  {/* Usuário/Órgão + Avatar */}
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-xs font-sans leading-tight max-w-[180px]">
                      <span className="text-[#696969] font-semibold">SEAP</span>
                      <span className="text-[#696969]"> - Secretaria da Administração</span>
                      <br />
                      <span className="text-[#696969]">Penitenciária do Rio de Janeiro</span>
                    </div>
                    {/* Avatar com iniciais - 32px circular, cor da vertical, gap-8 (32px) até botão Voltar */}
                    <div className="w-[32px] h-[32px] min-w-[32px] min-h-[32px] rounded-full bg-[#72284B] flex items-center justify-center text-white text-xs font-bold font-sans shrink-0">
                      SE
                    </div>
                  </div>
                  
                  {/* Gap de 32px (gap-8) entre avatar e botão Voltar */}
                  
                  {/* Botão Voltar - filled dark, margem direita 32px */}
                  <button className="flex items-center gap-2 h-9 px-4 ml-8 bg-[#333540] text-white text-sm font-sans font-bold rounded-[6px] hover:bg-[#3b3d4a] transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Voltar
                  </button>
                </div>
              </div>
            </div>

            {/* Regras do Header */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Anatomia do Header (REGRAS)</h4>
              <ul className="text-sm text-text-secondary font-sans list-disc ml-4 space-y-1">
                <li><strong>Altura:</strong> auto (padding vertical 16px)</li>
                <li><strong>Background:</strong> #0a0a0a (mesmo do canvas)</li>
                <li><strong>Logo:</strong> snap-graph-logo.svg, altura 24px</li>
                <li><strong>Separador:</strong> linha vertical 1px, cor #696969/#454545, altura 24px</li>
                <li><strong>Gap entre elementos:</strong> 16px (gap-4)</li>
              </ul>
            </div>
            
            {/* Elementos do Header - Direita */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Elementos da Direita (REGRAS)</h4>
              <ul className="text-sm text-text-secondary font-sans list-disc ml-4 space-y-1">
                <li><strong>Sino notificações:</strong> 20x20px, cor #696969, badge 18px circular bg-[#72284B]</li>
                <li><strong>Theme toggle:</strong> ícone sol/lua 20x20px, padding 6px, hover bg-[#2c2c2c]</li>
                <li><strong>Usuário/Órgão:</strong> max-width 180px, text-xs, até 2 linhas, alinhado à direita</li>
                <li><strong>Botão Voltar:</strong> filled bg-[#333540], chevron left + texto, rounded-[6px]</li>
              </ul>
            </div>
            
            {/* Regras do Breadcrumb */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Breadcrumb (REGRAS)</h4>
              <ul className="text-sm text-text-secondary font-sans list-disc ml-4 space-y-1">
                <li><strong>Primeiro item (Vertical):</strong> cor da vertical (#72284B para Inteligência) + ícone + font-medium</li>
                <li><strong>Itens intermediários:</strong> cor #696969 + font-medium</li>
                <li><strong>Item atual (último):</strong> cor #ffffff + font-semibold</li>
                <li><strong>Separador:</strong> {">"} em #454545</li>
                <li><strong>Font-size:</strong> 14px (text-sm)</li>
                <li><strong>Gap:</strong> 8px entre itens</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* ============================================
            ENTITY NODES
            ============================================ */}
        <Section title="Entity Nodes">
          <div className="space-y-6">
            {/* Preview dos Nodes */}
            <p className="text-sm text-text-secondary font-sans">
              Nós de entidade representam pessoas, empresas, telefones, veículos e outros objetos no grafo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Company Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="Techbiz Forense Digital LTDA">
                <div className="flex h-full">
                  <div className="w-1 bg-[#7c8db0]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Techbiz Forense Digital LTDA</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Person Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="Luiz Henrique de Souza Borges da Silva e Santos">
                <div className="flex h-full">
                  <div className="w-1 bg-[#9b7fb8]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Luiz Henrique de Souza Borges da Silva e Santos</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] overflow-hidden flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&h=88&fit=crop&crop=face" alt="Foto" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e8e0f0] bg-[#5c4a6b] rounded-full">Person SNAP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="(31) 92332-2122 Telefone celular">
                <div className="flex h-full">
                  <div className="w-1 bg-[#6b9490]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">(31) 92332-2122 Telefone celular</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#d8ebe9] bg-[#3d5a58] rounded-full">TrueCallerID</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="ABC-1234 Veículo Honda Civic 2020">
                <div className="flex h-full">
                  <div className="w-1 bg-[#7a9098]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">ABC-1234 Veículo Honda Civic 2020</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e0e8eb] bg-[#4a5a60] rounded-full">DETRAN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mais tipos de nodes */}
            <p className="text-sm text-text-muted font-sans uppercase tracking-wide mt-8">Mais tipos de entidade</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CPF Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="123.456.789-00">
                <div className="flex h-full">
                  <div className="w-1 bg-[#a87070]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">123.456.789-00</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#f0e0e0] bg-[#6b4a4a] rounded-full">Receita Federal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documento Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="Relatório de Inteligência #2024-001">
                <div className="flex h-full">
                  <div className="w-1 bg-[#a89870]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Relatório de Inteligência #2024-001</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#f0e8d8] bg-[#605540] rounded-full">INFOSEG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço Node */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="Av. Brasil, 1500 Centro, Belo Horizonte - MG">
                <div className="flex h-full">
                  <div className="w-1 bg-[#666666]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Av. Brasil, 1500 Centro, Belo Horizonte - MG</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e0e0e0] bg-[#404040] rounded-full">Manual</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Node - demonstra break-words para strings longas sem espaço */}
              <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden" title="contato@empresa.com.br">
                <div className="flex h-full">
                  <div className="w-1 bg-[#666666]" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-all">contato@empresa.com.br</p>
                      </div>
                      <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-[#696969]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e0e0e0] bg-[#404040] rounded-full">Manual</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Anatomia do Node - REGRAS */}
            <div className="mt-6 p-4 bg-[#1a2020] border border-[#287266] rounded-lg">
              <h4 className="text-sm font-bold text-[#4da89a] mb-3 font-sans">Anatomia do Entity Node (REGRAS OBRIGATÓRIAS)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-secondary font-sans">
                <div>
                  <p className="font-medium text-foreground mb-2">Dimensões</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Largura fixa:</strong> 256px (w-64)</li>
                    <li><strong>Altura:</strong> automática (cresce conforme conteúdo)</li>
                    <li><strong>Padding interno:</strong> 16px (p-4)</li>
                    <li><strong>Border-radius:</strong> 8px (rounded-lg)</li>
                    <li><strong>Background:</strong> #2c2c2c</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Barra de Destaque</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Largura:</strong> 4px (w-1)</li>
                    <li><strong>Posição:</strong> esquerda</li>
                    <li><strong>Cor:</strong> accent da categoria</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Nome da Entidade</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Font-size:</strong> 16px (text-base)</li>
                    <li><strong>Font-weight:</strong> 500 (medium)</li>
                    <li><strong>Line-height:</strong> 1.3</li>
                    <li><strong>Máx linhas:</strong> 2 (line-clamp-2)</li>
                    <li><strong>Cor:</strong> #ffffff</li>
                    <li><strong>Word-break:</strong> break-words (ou break-all para emails/URLs)</li>
                    <li><strong>Tooltip:</strong> title com nome completo</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Ícone Circular (POSIÇÃO FIXA)</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Tamanho:</strong> 44px (w-11 h-11)</li>
                    <li><strong>Stroke:</strong> 3px (border-[3px])</li>
                    <li><strong>Cor stroke:</strong> #696969</li>
                    <li><strong>Background:</strong> transparente</li>
                    <li><strong>Posição:</strong> canto superior direito, FIXO</li>
                    <li><strong>flex-shrink-0:</strong> NUNCA reduz tamanho</li>
                    <li><strong>Person:</strong> usar foto ao invés de ícone</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Label de Categoria</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Gap do nome:</strong> 16px (mt-4)</li>
                    <li><strong>Font-size:</strong> 12px (text-xs)</li>
                    <li><strong>Font-weight:</strong> 500</li>
                    <li><strong>Font-family:</strong> font-sans (NUNCA Cygnito)</li>
                    <li><strong>Padding:</strong> 12px x 4px (px-3 py-1)</li>
                    <li><strong>Border-radius:</strong> pill (rounded-full)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Ícones Lucide</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Empresa:</strong> Building</li>
                    <li><strong>Pessoa:</strong> User (ou foto)</li>
                    <li><strong>Telefone:</strong> Phone</li>
                    <li><strong>Veículo:</strong> Car</li>
                    <li><strong>CPF/Doc:</strong> CreditCard</li>
                    <li><strong>Endereço:</strong> MapPin</li>
                    <li><strong>Email:</strong> Mail</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Alerta importante */}
            <div className="mt-4 p-4 bg-[#2a1a1a] border border-[#fe473c] rounded-lg">
              <h4 className="text-sm font-bold text-[#fe473c] mb-2 font-sans">REGRA CRÍTICA: Quebra de Texto</h4>
              <p className="text-sm text-text-secondary font-sans">
                O texto do nome DEVE quebrar automaticamente em até 2 linhas. O ícone circular NUNCA pode mudar de posição 
                (flex-shrink-0). Para strings longas sem espaços (emails, URLs), usar <code className="font-sans text-[#fe473c]">break-all</code> 
                ao invés de <code className="font-sans text-[#fe473c]">break-words</code>.
              </p>
            </div>
          </div>
        </Section>

        {/* ============================================
            LABELS DE CATEGORIA
            ============================================ */}
        <Section title="Labels de Categoria">
          <div className="space-y-6">
            <p className="text-sm text-text-secondary font-sans">
              Paleta própria com cores dessaturadas que não conflitam com as cores das verticais do ecossistema.
              <strong className="text-foreground"> Todas as tags/badges usam border-radius 12px.</strong>
            </p>

            {/* Preview das labels */}
            <div className="flex flex-wrap gap-3 p-6 bg-[#1a1a1a] rounded-xl border border-border">
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#e8e0f0] bg-[#5c4a6b] rounded-full">Person SNAP</span>
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#d8ebe9] bg-[#3d5a58] rounded-full">TrueCallerID</span>
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#f0e0e0] bg-[#6b4a4a] rounded-full">Receita Federal</span>
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#e0e8eb] bg-[#4a5a60] rounded-full">DETRAN</span>
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#f0e8d8] bg-[#605540] rounded-full">INFOSEG</span>
              <span className="px-3 py-1 text-xs font-sans font-medium text-[#e0e0e0] bg-[#404040] rounded-full">Manual</span>
            </div>

            {/* Tabela de cores */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-text-muted font-medium">Categoria</th>
                    <th className="text-left py-2 text-text-muted font-medium">Background</th>
                    <th className="text-left py-2 text-text-muted font-medium">Texto</th>
                    <th className="text-left py-2 text-text-muted font-medium">Accent (barra)</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border/50">
                    <td className="py-2">Company SNAP</td>
                    <td className="py-2"><code className="font-sans text-[#7c8db0]">#4a5568</code></td>
                    <td className="py-2"><code className="font-sans text-[#e2e8f0]">#e2e8f0</code></td>
                    <td className="py-2"><code className="font-sans text-[#7c8db0]">#7c8db0</code></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Person SNAP</td>
                    <td className="py-2"><code className="font-sans text-[#9b7fb8]">#5c4a6b</code></td>
                    <td className="py-2"><code className="font-sans text-[#e8e0f0]">#e8e0f0</code></td>
                    <td className="py-2"><code className="font-sans text-[#9b7fb8]">#9b7fb8</code></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">TrueCallerID</td>
                    <td className="py-2"><code className="font-sans text-[#6b9490]">#3d5a58</code></td>
                    <td className="py-2"><code className="font-sans text-[#d8ebe9]">#d8ebe9</code></td>
                    <td className="py-2"><code className="font-sans text-[#6b9490]">#6b9490</code></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Receita Federal</td>
                    <td className="py-2"><code className="font-sans text-[#a87070]">#6b4a4a</code></td>
                    <td className="py-2"><code className="font-sans text-[#f0e0e0]">#f0e0e0</code></td>
                    <td className="py-2"><code className="font-sans text-[#a87070]">#a87070</code></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">DETRAN</td>
                    <td className="py-2"><code className="font-sans text-[#7a9098]">#4a5a60</code></td>
                    <td className="py-2"><code className="font-sans text-[#e0e8eb]">#e0e8eb</code></td>
                    <td className="py-2"><code className="font-sans text-[#7a9098]">#7a9098</code></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">INFOSEG</td>
                    <td className="py-2"><code className="font-sans text-[#a89870]">#605540</code></td>
                    <td className="py-2"><code className="font-sans text-[#f0e8d8]">#f0e8d8</code></td>
                    <td className="py-2"><code className="font-sans text-[#a89870]">#a89870</code></td>
                  </tr>
                  <tr>
                    <td className="py-2">Manual</td>
                    <td className="py-2"><code className="font-sans text-[#666666]">#404040</code></td>
                    <td className="py-2"><code className="font-sans text-[#e0e0e0]">#e0e0e0</code></td>
                    <td className="py-2"><code className="font-sans text-[#666666]">#666666</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ============================================
            CONEXÕES (EDGES)
            ============================================ */}
        <Section title="Conexões (Edges)">
          <div className="space-y-8">
            
            {/* Grafo Completo: Descoberta de Vínculo Oculto */}
            <div>
              <p className="text-sm text-text-muted font-sans mb-4 uppercase tracking-wide">Descoberta de Vínculo Oculto</p>
              <div className="relative bg-[#0a0a0a] rounded-xl border border-border overflow-hidden" style={{ height: '560px' }}>
                {/* Grid de fundo */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                
                {/* 
                  LAYOUT DO GRAFO:
                  ================
                  
                  TECHBIZ (left: 32px)          INSPECT (left: 368px)
                  top: 24px                     top: 24px
                  centro X: 32+128 = 160px      centro X: 368+128 = 496px
                  altura: ~110px                altura: ~110px
                  bottom: 134px                 bottom: 134px
                  centro Y: 24+55 = 79px        
                  
                                                    |
                                                    | (conexão vertical)
                                                    v
                                                    
                                                LUIZ HENRIQUE (left: 368px)
                                                top: 214px (134 + 80 gap)
                                                centro X: 496px
                                                altura: ~110px
                                                bottom: 324px
                                                    
                                                    |
                                                    | (conexão vertical)
                                                    v
                                                    
                                                TELEFONE (left: 368px)
                                                top: 404px (324 + 80 gap)
                                                centro X: 496px
                                                centro Y: 404+55 = 459px
                                                lateral esquerda: 368px
                  
                  CONEXÃO VÍNCULO OCULTO (BRANCA):
                  - Sai: lateral esquerda do Phone (X=368, Y=459 centro vertical)
                  - Waypoint 1: vai para esquerda até X=160 (centro da Techbiz)
                  - Waypoint 2: sobe até Y=134+6 (base da Techbiz + offset seta)
                  - Entra: base da Techbiz com seta apontando para cima
                */}
                
                {/* SVG para as conexões */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  <defs>
                    {/* Seta cinza (conexões normais) */}
                    <marker
                      id="arrow-normal"
                      markerWidth="12"
                      markerHeight="12"
                      refX="6"
                      refY="6"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0,0 12,6 0,12" fill="#454545" />
                    </marker>
                    
                    {/* Seta branca (vínculo descoberto) */}
                    <marker
                      id="arrow-discovery"
                      markerWidth="12"
                      markerHeight="12"
                      refX="6"
                      refY="6"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0,0 12,6 0,12" fill="#ffffff" />
                    </marker>
                  </defs>
                  
                  {/* Conexão 1: Inspect → Luiz Henrique (vertical normal) */}
                  <line
                    x1="496"
                    y1="134"
                    x2="496"
                    y2="202"
                    stroke="#454545"
                    strokeWidth="2"
                    markerEnd="url(#arrow-normal)"
                  />
                  
                  {/* Conexão 2: Luiz Henrique → Phone (vertical normal) */}
                  <line
                    x1="496"
                    y1="324"
                    x2="496"
                    y2="392"
                    stroke="#454545"
                    strokeWidth="2"
                    markerEnd="url(#arrow-normal)"
                  />
                  
                  {/* Conexão 3: Phone → Techbiz (VÍNCULO OCULTO - ortogonal com waypoint) */}
                  {/* Sai da lateral esquerda do Phone, vai até o centro X da Techbiz, sobe até a base */}
                  <path
                    d="M 368 459 L 160 459 L 160 146"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    markerEnd="url(#arrow-discovery)"
                  />
                </svg>
                
                {/* Nodes */}
                <div className="relative" style={{ zIndex: 2 }}>
                  
                  {/* Node 1: TECHBIZ (topo esquerda) - VÍNCULO DESCOBERTO */}
                  <div className="absolute" style={{ left: '32px', top: '24px' }}>
                    <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden outline outline-4 outline-white">
                      <div className="flex h-full">
                        <div className="w-1 bg-[#7c8db0]" />
                        <div className="flex-1 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Techbiz Forense Digital LTDA</p>
                            </div>
                            <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                              <Building className="w-5 h-5 text-[#696969]" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Node 2: INSPECT (topo direita) */}
                  <div className="absolute" style={{ left: '368px', top: '24px' }}>
                    <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden">
                      <div className="flex h-full">
                        <div className="w-1 bg-[#7c8db0]" />
                        <div className="flex-1 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Inspect Segurança Digital Tecnologia</p>
                            </div>
                            <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                              <Building className="w-5 h-5 text-[#696969]" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Node 3: LUIZ HENRIQUE (meio direita) */}
                  <div className="absolute" style={{ left: '368px', top: '214px' }}>
                    <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden">
                      <div className="flex h-full">
                        <div className="w-1 bg-[#9b7fb8]" />
                        <div className="flex-1 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">Luiz Henrique de Souza Borges</p>
                            </div>
                            <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] overflow-hidden flex-shrink-0">
                              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&h=88&fit=crop&crop=face" alt="Foto" className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e8e0f0] bg-[#5c4a6b] rounded-full">Person SNAP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Node 4: TELEFONE (baixo direita) - VÍNCULO DESCOBERTO */}
                  <div className="absolute" style={{ left: '368px', top: '404px' }}>
                    <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden outline outline-4 outline-white">
                      <div className="flex h-full">
                        <div className="w-1 bg-[#6b9490]" />
                        <div className="flex-1 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-base font-medium font-sans leading-[1.3] line-clamp-2 break-words">(31) 92332-2122 Telefone celular</p>
                            </div>
                            <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center flex-shrink-0">
                              <Phone className="w-5 h-5 text-[#696969]" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#d8ebe9] bg-[#3d5a58] rounded-full">TrueCallerID</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legenda e explicação */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#1a2020] border border-[#287266] rounded-lg">
                  <h4 className="text-sm font-bold text-[#4da89a] mb-2 font-sans">Regras de Conexão</h4>
                  <ul className="text-sm text-text-secondary font-sans space-y-1">
                    <li><strong>Vertical:</strong> Sai do centro inferior, entra no centro superior</li>
                    <li><strong>Lateral:</strong> Sai do centro vertical da lateral (esquerda ou direita)</li>
                    <li><strong>Waypoint:</strong> Ângulo de 90° sem border-radius</li>
                    <li><strong>Gap mínimo:</strong> 80px entre nodes</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-[#1a1a2a] border border-[#ffffff] rounded-lg">
                  <h4 className="text-sm font-bold text-white mb-2 font-sans">Vínculo Descoberto (Linha Branca)</h4>
                  <p className="text-sm text-text-secondary font-sans">
                    Ao investigar o sócio da Inspect (Luiz Henrique), descobriu-se um telefone vinculado à Techbiz, 
                    <strong className="text-white"> comprovando um vínculo oculto</strong> entre as duas empresas.
                  </p>
                </div>
              </div>
              
              {/* Documentação do Use Case */}
              <div className="mt-6 p-6 bg-[#12121a] border border-[#72284B] rounded-lg">
                <h4 className="text-lg font-bold text-[#72284B] mb-4 font-sans">Use Case: Descoberta de Vínculo Oculto</h4>
                <p className="text-sm text-text-muted font-sans mb-4 italic">
                  Este cenário é a base para o protótipo interativo no Kiro.
                </p>
                
                <div className="space-y-4 text-sm text-text-secondary font-sans">
                  {/* Contexto */}
                  <div>
                    <h5 className="font-semibold text-foreground mb-1">Contexto</h5>
                    <p>
                      Duas empresas concorrentes no mercado de segurança digital: <strong>Techbiz Forense Digital LTDA</strong> e 
                      <strong> Inspect Segurança Digital Tecnologia</strong>. Não há vínculo societário direto aparente entre elas.
                    </p>
                  </div>
                  
                  {/* Entidades */}
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">Entidades Envolvidas</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 pr-4 text-text-muted font-medium">Entidade</th>
                            <th className="py-2 pr-4 text-text-muted font-medium">Tipo</th>
                            <th className="py-2 pr-4 text-text-muted font-medium">Cor Lateral</th>
                            <th className="py-2 text-text-muted font-medium">Label</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50">
                            <td className="py-2 pr-4">Techbiz Forense Digital LTDA</td>
                            <td className="py-2 pr-4">Company</td>
                            <td className="py-2 pr-4"><span className="inline-block w-3 h-3 rounded-sm bg-[#7c8db0]" /> <span className="font-sans">#7c8db0</span></td>
                            <td className="py-2"><span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span></td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 pr-4">Inspect Segurança Digital Tecnologia</td>
                            <td className="py-2 pr-4">Company</td>
                            <td className="py-2 pr-4"><span className="inline-block w-3 h-3 rounded-sm bg-[#7c8db0]" /> <span className="font-sans">#7c8db0</span></td>
                            <td className="py-2"><span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span></td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 pr-4">Luiz Henrique de Souza Borges</td>
                            <td className="py-2 pr-4">Person</td>
                            <td className="py-2 pr-4"><span className="inline-block w-3 h-3 rounded-sm bg-[#9b7fb8]" /> <span className="font-sans">#9b7fb8</span></td>
                            <td className="py-2"><span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e8e0f0] bg-[#5c4a6b] rounded-full">Person SNAP</span></td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">(31) 92332-2122 - Telefone celular</td>
                            <td className="py-2 pr-4">Phone</td>
                            <td className="py-2 pr-4"><span className="inline-block w-3 h-3 rounded-sm bg-[#6b9490]" /> <span className="font-sans">#6b9490</span></td>
                            <td className="py-2"><span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#d8ebe9] bg-[#3d5a58] rounded-full">TrueCallerID</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Fluxo de Investigação */}
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">Fluxo de Investigação</h5>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Analista parte da empresa <strong>Inspect</strong> como ponto de interesse</li>
                      <li>Expande para ver sócios → encontra <strong>Luiz Henrique</strong></li>
                      <li>Expande dados de Luiz Henrique → encontra <strong>telefone (31) 92332-2122</strong></li>
                      <li>Sistema cruza o telefone com outras bases → descobre vínculo com <strong>Techbiz</strong></li>
                      <li><strong className="text-white">Vínculo oculto revelado!</strong> As empresas têm conexão através do telefone do sócio</li>
                    </ol>
                  </div>
                  
                  {/* Conexões */}
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">Conexões (Edges)</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 pr-4 text-text-muted font-medium">De</th>
                            <th className="py-2 pr-4 text-text-muted font-medium">Para</th>
                            <th className="py-2 pr-4 text-text-muted font-medium">Tipo</th>
                            <th className="py-2 text-text-muted font-medium">Cor</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50">
                            <td className="py-2 pr-4">Inspect</td>
                            <td className="py-2 pr-4">Luiz Henrique</td>
                            <td className="py-2 pr-4">Vertical (centro inferior → centro superior)</td>
                            <td className="py-2">#454545</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 pr-4">Luiz Henrique</td>
                            <td className="py-2 pr-4">Telefone</td>
                            <td className="py-2 pr-4">Vertical (centro inferior → centro superior)</td>
                            <td className="py-2">#454545</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Telefone</td>
                            <td className="py-2 pr-4">Techbiz</td>
                            <td className="py-2 pr-4">Ortogonal com waypoint (lateral esquerda → base)</td>
                            <td className="py-2 font-semibold text-white">#FFFFFF (vínculo descoberto)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Posicionamento */}
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">Posicionamento dos Nodes</h5>
                    <div className="bg-[#0a0a0a] p-4 rounded font-mono text-xs overflow-x-auto">
                      <pre>{`// Coordenadas absolutas (em pixels)
// Node largura: 256px | Centro horizontal: left + 128px

TECHBIZ:       left: 32px,  top: 24px   → centro X: 160px
INSPECT:       left: 368px, top: 24px   → centro X: 496px
LUIZ HENRIQUE: left: 368px, top: 214px  → centro X: 496px  (gap 80px de Inspect)
TELEFONE:      left: 368px, top: 404px  → centro X: 496px  (gap 80px de Luiz)

// Altura estimada de cada node: ~110px
// Gap entre nodes: 80px`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Anatomia da conexão */}
            <div>
              <p className="text-sm text-text-muted font-sans mb-4 uppercase tracking-wide">Anatomia da Conexão</p>
              <div className="p-6 bg-[#0a0a0a] rounded-xl border border-border">
                <svg width="100%" height="120" viewBox="0 0 600 120">
                  {/* Seta de referência */}
                  <defs>
                    <marker
                      id="arrowhead-demo"
                      markerWidth="12"
                      markerHeight="12"
                      refX="10"
                      refY="6"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0,0 12,6 0,12" fill="#454545" />
                    </marker>
                  </defs>
                  
                  {/* Linha de exemplo */}
                  <path
                    d="M 50 60 L 200 60 L 200 100 L 400 100"
                    fill="none"
                    stroke="#454545"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-demo)"
                  />
                  
                  {/* Anotações */}
                  <text x="125" y="45" className="text-[10px] fill-[#696969] font-sans" textAnchor="middle">stroke: 2px</text>
                  <text x="125" y="80" className="text-[10px] fill-[#696969] font-sans" textAnchor="middle">cor: #454545</text>
                  
                  <text x="200" y="30" className="text-[10px] fill-[#fe473c] font-sans" textAnchor="middle">waypoint 90°</text>
                  <circle cx="200" cy="60" r="4" fill="#fe473c" />
                  <circle cx="200" cy="100" r="4" fill="#fe473c" />
                  
                  <text x="450" y="85" className="text-[10px] fill-[#696969] font-sans" textAnchor="start">seta: 12x12px</text>
                  
                  {/* Box indicando área da seta */}
                  <rect x="400" y="94" width="12" height="12" fill="none" stroke="#696969" strokeWidth="1" strokeDasharray="2" />
                </svg>
              </div>
            </div>

            {/* Regras de Roteamento */}
            <div className="p-4 bg-[#2a1a1a] border border-[#fe473c] rounded-lg">
              <h4 className="text-sm font-bold text-[#fe473c] mb-3 font-sans">Regras de Roteamento (CRÍTICO)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-secondary font-sans">
                <div>
                  <p className="font-medium text-foreground mb-2">Especificações</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Stroke:</strong> 2px</li>
                    <li><strong>Cor:</strong> #454545</li>
                    <li><strong>Linecap:</strong> square</li>
                    <li><strong>Seta:</strong> 12x12px, triângulo preenchido na extremidade final</li>
                    <li><strong>Waypoints:</strong> ângulos de 90° (sem border-radius)</li>
                    <li><strong>Gap mínimo nodes:</strong> 80px (vertical e horizontal)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Proibições</p>
                  <ul className="list-disc ml-4 space-y-1 text-[#fe473c]">
                    <li><strong>NUNCA</strong> usar linhas diagonais</li>
                    <li><strong>NUNCA</strong> passar por cima de nodes</li>
                    <li><strong>NUNCA</strong> cruzar outras conexões</li>
                    <li><strong>SEMPRE</strong> roteamento ortogonal (90°)</li>
                    <li><strong>NUNCA</strong> usar border-radius nas curvas</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-text-muted font-sans mt-4">
                O visual deve ser semelhante a um circuito eletrônico: limpo, organizado e previsível.
              </p>
            </div>
          </div>
        </Section>

        {/* ============================================
            ESTADOS INTERATIVOS
            ============================================ */}
        <Section title="Estados Interativos">
          <div className="space-y-6">
            <p className="text-sm text-text-secondary font-sans">
              Estados visuais para feedback de interação com os elementos do grafo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estado Normal */}
              <div>
                <p className="text-sm text-text-muted font-sans mb-3 uppercase tracking-wide">Normal</p>
                <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden">
                  <div className="flex h-full">
                    <div className="w-1 bg-[#7c8db0]" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-white text-base font-medium font-sans leading-[1.3]">Entidade Normal</p>
                        <div className="w-11 h-11 rounded-full border-[3px] border-[#696969] flex items-center justify-center">
                          <Building className="w-5 h-5 text-[#696969]" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado Hover */}
              <div>
                <p className="text-sm text-text-muted font-sans mb-3 uppercase tracking-wide">Hover</p>
                <div className="w-64 bg-[#363636] rounded-lg overflow-hidden ring-1 ring-[#696969]">
                  <div className="flex h-full">
                    <div className="w-1 bg-[#7c8db0]" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-white text-base font-medium font-sans leading-[1.3]">Entidade Hover</p>
                        <div className="w-11 h-11 rounded-full border-[3px] border-[#888888] flex items-center justify-center">
                          <Building className="w-5 h-5 text-[#888888]" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado Selecionado */}
              <div>
                <p className="text-sm text-text-muted font-sans mb-3 uppercase tracking-wide">Selecionado</p>
                <div className="w-64 bg-[#2c2c2c] rounded-lg overflow-hidden ring-2 ring-white">
                  <div className="flex h-full">
                    <div className="w-1 bg-[#7c8db0]" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-white text-base font-medium font-sans leading-[1.3]">Entidade Selecionada</p>
                        <div className="w-11 h-11 rounded-full border-[3px] border-white flex items-center justify-center">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 text-xs font-sans font-medium text-[#e2e8f0] bg-[#4a5568] rounded-full">Company SNAP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regras de estados */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Especificações de Estados</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary font-sans">
                <div>
                  <p className="font-medium text-foreground mb-1">Normal</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Background: #2c2c2c</li>
                    <li>Ícone: #696969</li>
                    <li>Sem ring/outline</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Hover</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Background: #363636</li>
                    <li>Ícone: #888888</li>
                    <li>Ring: 1px #696969</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Selecionado</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Background: #2c2c2c</li>
                    <li>Ícone: #ffffff</li>
                    <li>Ring: 2px #ffffff</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <Link 
              href="/design-system" 
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Design System Base
            </Link>
            <p className="text-sm text-text-muted font-sans">
              SNAP Graph v1.0 - Documentação para Kiro
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
