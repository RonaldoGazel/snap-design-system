"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Copy, ArrowLeft, User, MapPin, Car, Building, AlertTriangle, Sparkles, X, Eye, Download, Trash2, Search, FileText, Calendar } from "lucide-react"
import Link from "next/link"

/* ============================================
   SNAP DESIGN SYSTEM
   Consolidado a partir de 7+ telas de referência do Figma
   ============================================ */

// Verticais do Ecossistema SNAP
const verticais = [
  { name: "INVESTIGAÇÃO", color: "#fe473c", icon: "Lupa" },
  { name: "INTELIGÊNCIA", color: "#72284b", icon: "Cabeça/Cérebro" },
  { name: "COOPERAÇÃO", color: "#72758a", icon: "Pessoas" },
  { name: "INFRAESTRUTURA", color: "#3f9f76", icon: "Nós conectados" },
  { name: "ADMINISTRAÇÃO", color: "#333540", icon: "Pessoa com engrenagem" },
]

// Cores Base
const coresBase = {
  "Backgrounds": [
    { name: "background", value: "#0a0a0a", token: "--background", description: "Fundo principal da aplicação" },
    { name: "card", value: "#1a1a1a", token: "--card", description: "Fundo de cards e containers" },
    { name: "card-elevated", value: "#242424", token: "--card-elevated", description: "Card com elevação" },
    { name: "card-hover", value: "#2a2a2a", token: "--card-hover", description: "Estado hover de cards" },
    { name: "input", value: "#000000", token: "--input", description: "Fundo de inputs e textareas (PRETO PURO)" },
  ],
  "Status": [
    { name: "success", value: "#3f9f76", token: "--success", description: "Sucesso, vincular, criar (VERDE)" },
    { name: "success-dark", value: "#1b5e20", token: "--success-dark", description: "Background de toast de sucesso" },
    { name: "warning", value: "#ffc563", token: "--warning", description: "Avisos, prioridade alta (AMARELO)" },
    { name: "info", value: "#00bcd4", token: "--info", description: "Info, tramitar (CIANO)" },
    { name: "error", value: "#fe473c", token: "--error", description: "Erros, risco crítico (VERMELHO)" },
  ],
  "Entidades (para links no texto)": [
    { name: "entity-person", value: "#72284b", token: "--entity-person", description: "Pessoa = Rosa" },
    { name: "entity-address", value: "#d4a017", token: "--entity-address", description: "Endereço = Amarelo" },
    { name: "entity-vehicle", value: "#00bcd4", token: "--entity-vehicle", description: "Veículo = Ciano" },
    { name: "entity-company", value: "#00bcd4", token: "--entity-company", description: "Empresa = Ciano" },
  ],
  "Níveis de Risco": [
    { name: "risk-critical", value: "#fe473c", token: "--risk-critical", description: "Risco Crítico" },
    { name: "risk-high", value: "#ff9800", token: "--risk-high", description: "Risco Alto" },
    { name: "risk-medium", value: "#ffc563", token: "--risk-medium", description: "Risco Médio" },
    { name: "risk-low", value: "#3f9f76", token: "--risk-low", description: "Risco Baixo" },
  ],
  "Tags de Categoria": [
    { name: "tag-preso", value: "#72284b", token: "--tag-preso", description: "Preso" },
    { name: "tag-visitante", value: "#00bcd4", token: "--tag-visitante", description: "Visitante" },
    { name: "tag-advogado", value: "#3f9f76", token: "--tag-advogado", description: "Advogado" },
    { name: "tag-familiar", value: "#ffc563", token: "--tag-familiar", description: "Familiar" },
    { name: "tag-ex-preso", value: "#ff9800", token: "--tag-ex-preso", description: "Ex-preso" },
  ],
  "Texto": [
    { name: "text-primary", value: "#ffffff", token: "--text-primary", description: "Texto principal" },
    { name: "text-secondary", value: "#a0a0a0", token: "--text-secondary", description: "Texto secundário" },
    { name: "text-muted", value: "#888888", token: "--text-muted", description: "Headers de tabela, placeholders" },
    { name: "text-subtle", value: "#666666", token: "--text-subtle", description: "Texto muito sutil" },
  ],
  "Bordas": [
    { name: "border", value: "#2a2a2a", token: "--border", description: "Borda padrão" },
    { name: "border-subtle", value: "#333333", token: "--border-subtle", description: "Borda sutil" },
  ],
}

// Tipografia
const tipografia = {
  regras: [
    "Cygnito Mono: SEMPRE em UPPERCASE",
    "Cygnito Mono: APENAS em tamanhos >= 18px (text-lg ou maior)",
    "Cygnito Mono: Fica ruim reduzida - usar Inter Tight em tamanhos menores",
    "Inter Tight: Fonte principal para corpo, labels, botões, tags",
  ],
  familias: [
    { 
      name: "Inter Tight", 
      class: "font-sans", 
      sample: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789",
      usos: ["Corpo de texto", "Labels", "Botões", "Tags/Badges", "Texto < 18px"]
    },
    { 
      name: "Cygnito Mono", 
      class: "font-title", 
      sample: "SNAP PROCESSOS DOCUMENTOS PESSOAS",
      usos: ["Títulos de seção", "Títulos de modal", "Títulos de card (Pessoa, Endereço)", "Números grandes"]
    },
  ],
}

// Padrões de Botões
const padroesBotoes = [
  { contexto: "Criar/Vincular entidade", negativo: "Cancelar/Ignorar (outline cinza)", positivo: "Criar/Vincular (filled VERDE #3f9f76)" },
  { contexto: "Confirmação positiva", negativo: "Cancelar (outline cinza)", positivo: "Confirmar (filled VERDE #3f9f76)" },
  { contexto: "Confirmação incerta", negativo: "Cancelar (outline)", positivo: "Confirmar (outline - não filled!)" },
  { contexto: "Ação destrutiva", negativo: "-", positivo: "Remover vinculação (filled ROSA #72284b)" },
  { contexto: "Ação de módulo", negativo: "Tramitar (outline)", positivo: "Formalizar (filled VERDE #3f9f76)" },
]

// Dados do Accordion de Difusão
const accordionData = [
  {
    id: 'mpmg',
    title: 'Ministério Público de Minas Gerais',
    items: [
      { id: 'subsec', label: 'SUBSEC', checked: true, disabled: true },
      { id: 'sup-contra', label: 'SUP-CONTRA-INTEL', checked: true, disabled: true },
      { id: 'coord-seg', label: 'Coordenadoria de Segurança', checked: false },
      { id: 'div-analise', label: 'Divisão de Análise Criminal', checked: false },
      { id: 'nucleo-intel', label: 'Núcleo de Inteligência', checked: false },
      { id: 'assessoria', label: 'Assessoria Especial', checked: false },
    ]
  },
  {
    id: 'entidade-especial',
    title: 'Entidade especial dentre 150',
    items: [
      { id: 'setor-a', label: 'Setor A', checked: false },
      { id: 'setor-b', label: 'Setor B', checked: false },
      { id: 'setor-c', label: 'Setor C', checked: false },
    ]
  },
  {
    id: 'tse',
    title: 'Tribunal Superior Eleitoral',
    items: [
      { id: 'gabinete', label: 'Gabinete da Presidência', checked: false },
      { id: 'secretaria', label: 'Secretaria de Segurança', checked: false },
      { id: 'coord-tse', label: 'Coordenação de Inteligência', checked: false },
      { id: 'nucleo-tse', label: 'Núcleo de Análise', checked: false },
    ]
  }
]

// Componente Accordion Interativo para Modal Difusão
function DifusaoAccordion() {
  const [openItems, setOpenItems] = useState<string[]>(['mpmg'])
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'subsec': true,
    'sup-contra': true,
  })

  const toggleAccordion = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const toggleCheckbox = (itemId: string, disabled?: boolean) => {
    if (disabled) return
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  return (
    <div className="space-y-2">
      {accordionData.map((section) => {
        const isOpen = openItems.includes(section.id)
        return (
          <div key={section.id}>
            {/* Header do Accordion */}
            <button
              onClick={() => toggleAccordion(section.id)}
              className={`w-full flex items-center gap-3 p-2 hover:bg-[#2a2b35] transition-colors cursor-pointer ${
                isOpen ? 'bg-[#2a2b35] rounded-t-lg' : 'rounded-lg'
              }`}
            >
              <svg 
                className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <User className="w-4 h-4 text-text-secondary" />
              <span className={`text-sm font-sans ${isOpen ? 'text-foreground' : 'text-text-muted'}`}>
                {section.title}
              </span>
            </button>
            
            {/* Conteúdo expandido */}
            {isOpen && (
              <div className="bg-[#1a1b1e] border-x border-b border-[#2a2b35] rounded-b-lg max-h-[140px] overflow-y-auto scrollbar-minimal">
                <div className="p-2 space-y-1">
                  {section.items.map((item) => {
                    const isChecked = checkedItems[item.id] || item.checked
                    return (
                      <label 
                        key={item.id}
                        onClick={() => toggleCheckbox(item.id, item.disabled)}
                        className={`flex items-center gap-3 p-2 hover:bg-[#2a2b35] rounded ${item.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked 
                            ? 'border-[#72284b] bg-[#72284b]' 
                            : 'border-[#676c70] bg-transparent'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm font-sans ${isChecked ? 'text-foreground' : 'text-text-muted'}`}>
                          {item.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Dados do Select de Destinatários
const destinatarios = [
  'Chefe Contrainteligência',
  'Diretor de Operações',
  'Coordenador de Análise',
  'Supervisor de Campo',
  'Assessor Especial',
]

// Dados das Tabs do modal Tramitar
const tramitarTabs = [
  { id: 'confeccionar', label: 'Confeccionar', icon: 'FileText' },
  { id: 'revisar', label: 'Revisar', icon: 'Eye' },
  { id: 'analisar', label: 'Analisar', icon: 'Search' },
  { id: 'formalizar', label: 'Formalizar', icon: 'Check' },
]

// Componente Modal Tramitar Interativo
function TramitarModal() {
  const [selectOpen, setSelectOpen] = useState(false)
  const [selectedDestinatario, setSelectedDestinatario] = useState('Chefe Contrainteligência')
  const [activeTab, setActiveTab] = useState('confeccionar')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 })

  const handleSelectOption = (option: string) => {
    setSelectedDestinatario(option)
    setSelectOpen(false)
  }

  // Atualiza a posição e largura da barrinha quando a tab muda
  useEffect(() => {
    const activeIndex = tramitarTabs.findIndex(t => t.id === activeTab)
    const activeTabElement = tabRefs.current[activeIndex]
    if (activeTabElement) {
      setTabIndicator({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      })
    }
  }, [activeTab])

  return (
    <div className="bg-[#101112] rounded-xl border border-[#2a2b35] max-w-md mx-auto overflow-hidden">
      {/* Header compacto */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#72284b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="font-title text-[18px]">TRAMITAR PROCESSO</span>
          </div>
          <button className="p-1 rounded hover:bg-[#2a2b35] transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>
      
      {/* Linha separadora do header */}
      <div className="h-[1px] bg-[#2a2b35]" />

      {/* Conteúdo */}
      <div className="p-6">
        {/* Select Interativo - Estilo Accordion */}
        <div className="mb-6">
          <label className="text-sm text-foreground mb-2 block font-sans">
            Selecione um destinatário <span className="text-foreground">*</span>
          </label>
          <div className="bg-[#2a2b35] border border-[#2a2b35] rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectOpen(!selectOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#3a3b45] transition-colors"
            >
              <span className="text-text-secondary text-sm font-sans">{selectedDestinatario}</span>
              <svg 
                className={`w-4 h-4 text-text-muted transition-transform duration-200 ${selectOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Dropdown estilo Accordion */}
            <div 
              className={`bg-[#1a1b1e] overflow-hidden transition-all duration-200 ease-out ${
                selectOpen ? 'max-h-[160px] border-t border-[#2a2b35]' : 'max-h-0'
              }`}
            >
              <div className="overflow-y-auto max-h-[160px] scrollbar-minimal">
                {destinatarios.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-4 py-3 text-sm font-sans hover:bg-[#2a2b35] transition-colors ${
                      option === selectedDestinatario 
                        ? 'text-foreground bg-[#2a2b35]' 
                        : 'text-text-muted'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Animadas - Barrinha segue largura real da tab */}
        <div className="mb-6 relative">
          {/* Linha base */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#2a2b35] z-0" />
          
          <div className="flex gap-6 relative">
            {tramitarTabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[index] = el }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 text-sm font-sans relative pb-5 transition-colors ${
                    isActive ? 'text-foreground' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.icon === 'FileText' && <FileText className={`w-4 h-4 ${isActive ? 'text-[#72284b]' : ''}`} />}
                  {tab.icon === 'Eye' && <Eye className={`w-4 h-4 ${isActive ? 'text-[#72284b]' : ''}`} />}
                  {tab.icon === 'Search' && <Search className={`w-4 h-4 ${isActive ? 'text-[#72284b]' : ''}`} />}
                  {tab.icon === 'Check' && <Check className={`w-4 h-4 ${isActive ? 'text-[#72284b]' : ''}`} />}
                  <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
                </button>
              )
            })}
            
            {/* Barrinha animada - segue largura e posição real da tab */}
            <div 
              className="absolute bottom-0 h-[8px] bg-[#72284b] z-10 transition-all duration-300 ease-out"
              style={{
                left: tabIndicator.left,
                width: tabIndicator.width,
              }}
            />
          </div>
        </div>

        {/* Conteúdo da Tab - margem de 36px (mb-9) */}
        <div className="mb-9">
          <label className="text-sm text-foreground mb-2 block font-sans">
            {activeTab === 'confeccionar' && 'Observação'}
            {activeTab === 'revisar' && 'Parecer da Revisão'}
            {activeTab === 'analisar' && 'Análise Técnica'}
            {activeTab === 'formalizar' && 'Despacho Final'}
            <span className="text-foreground"> *</span>
          </label>
          <textarea 
            className="w-full bg-[#000000] border border-[#2a2b35] rounded-lg px-4 py-3 text-sm text-text-secondary font-sans resize-none focus:border-[#72284b] focus:outline-none transition-colors"
            rows={5}
            placeholder={
              activeTab === 'confeccionar' ? 'Descreva o motivo da tramitação...' :
              activeTab === 'revisar' ? 'Insira o parecer da revisão...' :
              activeTab === 'analisar' ? 'Descreva a análise técnica...' :
              'Insira o despacho final...'
            }
          />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3">
          <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-sm font-bold font-sans hover:bg-[#2a2b35] transition-colors">
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-[#72284b] text-white text-sm font-bold font-sans hover:bg-[#5a1f3c] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Tramitar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Dados das Tabs de Exemplo
const exampleTabs = [
  { id: 'documentos', label: 'Documentos', icon: 'FileText' },
  { id: 'tramitacoes', label: 'Tramitações', icon: 'ArrowLeftRight' },
  { id: 'auditoria', label: 'Auditoria', icon: 'ClipboardList' },
]

// Componente Tabs Interativo (Exemplo Visual)
function ExampleTabs() {
  const [activeTab, setActiveTab] = useState('documentos')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeIndex = exampleTabs.findIndex(t => t.id === activeTab)
    const activeTabElement = tabRefs.current[activeIndex]
    if (activeTabElement) {
      setTabIndicator({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      })
    }
  }, [activeTab])

  // Renderiza o ícone baseado no tipo
  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `w-4 h-4 ${isActive ? 'text-[#72284b]' : ''}`
    switch (iconName) {
      case 'FileText':
        return <FileText className={iconClass} />
      case 'ArrowLeftRight':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )
      case 'ClipboardList':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative">
      {/* Linha base */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#2a2b35] z-0" />
      <div className="flex gap-6">
        {exampleTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-sm font-sans relative pb-5 transition-colors ${
                isActive ? 'text-foreground' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {renderIcon(tab.icon, isActive)}
              <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
            </button>
          )
        })}
        {/* Barrinha animada */}
        <div 
          className="absolute bottom-0 h-[8px] bg-[#72284b] z-10 transition-all duration-300 ease-out"
          style={{
            left: tabIndicator.left,
            width: tabIndicator.width,
          }}
        />
      </div>
    </div>
  )
}

// Componente Toggle Buttons Interativo
function ExampleToggle() {
  const [active, setActive] = useState<'ativas' | 'encerradas'>('ativas')

  return (
    <div className="inline-flex rounded-full overflow-hidden border border-border">
      <button 
        onClick={() => setActive('ativas')}
        className={`px-4 py-2 font-sans text-sm transition-colors ${
          active === 'ativas' 
            ? 'bg-[#72284b] text-white' 
            : 'bg-transparent text-text-muted hover:text-text-secondary'
        }`}
      >
        Ativas
      </button>
      <button 
        onClick={() => setActive('encerradas')}
        className={`px-4 py-2 font-sans text-sm transition-colors ${
          active === 'encerradas' 
            ? 'bg-[#72284b] text-white' 
            : 'bg-transparent text-text-muted hover:text-text-secondary'
        }`}
      >
        Encerradas
      </button>
    </div>
  )
}

// Componentes
const componentes = [
  { 
    name: "Modal/Dialog", 
    estrutura: "Ícone + Título Cygnito UPPERCASE + X fechar | Conteúdo | Botões alinhados à direita",
    detalhes: ["Background: #1a1a1a", "Padding: 24px", "Border-radius: 12px"]
  },
  { 
    name: "EntityCard", 
    estrutura: "Ícone rosa + Título UPPERCASE + Badge contador | Box cinza com descrição | Key-value pairs | Botões Ignorar/Vincular",
    detalhes: ["Ícone e título em rosa #72284b", "Box descrição: background mais escuro"]
  },
  { 
    name: "Tabs (Underline)", 
    estrutura: "Ícone + Label | Underline como indicador da tab ativa (NÃO background/pill)",
    detalhes: ["Tab ativa: underline na cor da vertical, texto branco", "Tab inativa: sem underline, texto cinza"]
  },
  { 
    name: "Tabs (Pill) - em Cards", 
    estrutura: "Usado em filtros dentro de cards (ex: todos | novos registros | integração)",
    detalhes: ["Tab ativa: background rosa pill, texto branco", "Tab inativa: transparente, texto cinza"]
  },
  { 
    name: "Toggle Buttons", 
    estrutura: "Segmented control para filtros binários (Ativas | Encerradas)",
    detalhes: ["Ativo: background rosa, texto branco", "Inativo: transparente, texto cinza", "Border-radius: pill"]
  },
  { 
    name: "DataTable", 
    estrutura: "Header (texto cinza, sem background) | Rows sem bordas entre linhas | Ações à direita",
    detalhes: ["Altura de row: 40-48px", "Ações: ícones (olho, download em cinza; lixeira em rosa)"]
  },
  { 
    name: "Toast Sucesso", 
    estrutura: "Ícone check + Título bold + Descrição | Posição: top-right",
    detalhes: ["Background: verde escuro #1b5e20", "Border-radius: 8px"]
  },
  { 
    name: "DropZone", 
    estrutura: "Borda tracejada cinza | Texto centralizado (arrastar ou clicar)",
    detalhes: ["Borda: 2px dashed", "Border-radius: 8px"]
  },
  { 
    name: "Inline Edit", 
    estrutura: "Click no título ativa modo edição | Borda rosa ao redor | Cursor no final",
    detalhes: ["Borda: 2px solid #72284b", "Background: mantém transparente"]
  },
  { 
    name: "Empty State", 
    estrutura: "Ícone grande cinza | Título | Descrição | Centralizado",
    detalhes: ["Ícone: cor sutil", "Título: branco, semi-bold", "Descrição: cinza"]
  },
  { 
    name: "Autocomplete com IA", 
    estrutura: "Input com ícone busca | Lista de sugestões | Badge 'IA' para sugestões de IA",
    detalhes: ["Badge IA: ícone sparkle + 'IA' em pill cinza", "Item selecionado: background com borda"]
  },
  { 
    name: "PersonCard (Grid)", 
    estrutura: "Foto circular | Badge contador (canto superior direito) | Risk badge (canto superior esquerdo) | Nome bold | Apelido em aspas | Tag principal | Tags secundárias outline | Footer com data",
    detalhes: ["Grid responsivo: 4 colunas", "Foto: ~64px, circular", "Badge contador: círculo rosa"]
  },
  { 
    name: "Paginação", 
    estrutura: "Botão 'Página anterior' | Números com elipses | Botão 'Próxima página'",
    detalhes: ["Página atual: bold/destacado", "Elipses: ..."]
  },
  { 
    name: "Card Estatísticas", 
    estrutura: "Número grande Cygnito | Label | Barra de progresso segmentada por categoria | Legenda",
    detalhes: ["Número: Cygnito Mono, 24-32px", "Barra: cores das tags"]
  },
  { 
    name: "Card Comentários", 
    estrutura: "Ícone + Título UPPERCASE + Badge contador | Badge 'NOVO' verde | Texto itálico | Avatar + data + cargo | Link 'Ver todos'",
    detalhes: ["Badge NOVO: #3f9f76, pill"]
  },
]

// Espaçamentos
const espacamentos = [
  { nome: "Card Padding", valor: "16px" },
  { nome: "Card Gap", valor: "16px" },
  { nome: "Row Height (tabela)", valor: "40-48px" },
  { nome: "Tab Padding", valor: "16px horizontal" },
  { nome: "Modal Padding", valor: "24px" },
]

// Border Radius
const borderRadius = [
  { nome: "Cards, Modais", valor: "12px", classe: "rounded-xl" },
  { nome: "Inputs, Botões", valor: "8px", classe: "rounded-lg" },
  { nome: "Tags, Badges", valor: "4-6px", classe: "rounded-md" },
  { nome: "Pills", valor: "9999px", classe: "rounded-full" },
  { nome: "Avatar", valor: "50%", classe: "rounded-full" },
]

// Componente ColorSwatch
function ColorSwatch({ name, value, token, description }: { name: string; value: string; token: string; description: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-card-hover transition-colors group">
      <div
        className="w-12 h-12 rounded-lg border border-border shrink-0"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono">{value}</code>
        </div>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => copyToClipboard(token)}
        className="p-2 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copiar token"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-muted" />}
      </button>
    </div>
  )
}

// Componente Section
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl text-foreground mb-6 pb-2 border-b border-border">{title}</h2>
      {children}
    </section>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </Link>
            <div>
              <h1 className="text-xl text-foreground">SNAP DESIGN SYSTEM</h1>
              <p className="text-sm text-text-muted font-sans">Consolidado a partir de 7+ telas de referência do Figma</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ============================================
            VERTICAIS DO ECOSSISTEMA SNAP
            ============================================ */}
        <Section title="VERTICAIS DO ECOSSISTEMA SNAP">
          <p className="text-text-secondary mb-4 font-sans">
            O SNAP é um ecossistema com 5 verticais. Cada vertical tem sua cor primária que define botões de ação principal, destaques e indicadores.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {verticais.map((v) => (
              <div key={v.name} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4">
                  <p className="text-xs text-text-muted mb-1 font-sans">{v.icon}</p>
                  <p className="font-title text-lg">{v.name}</p>
                </div>
                <div className="h-2" style={{ backgroundColor: v.color }} />
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: v.color }} />
                  <code className="text-xs text-text-muted font-mono">{v.color}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-warning-dark/20 border border-warning-dark">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <p className="text-text-secondary text-sm font-sans">
                <strong>Regra:</strong> A cor primária da aplicação muda conforme a vertical ativa. Botões de ação principal, tabs ativas e indicadores usam a cor da vertical.
              </p>
            </div>
          </div>
        </Section>

        {/* ============================================
            TIPOGRAFIA
            ============================================ */}
        <Section title="TIPOGRAFIA">
          <div className="p-4 rounded-xl bg-error/10 border border-error mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground font-medium font-sans">Regras da Cygnito Mono (IMPORTANTE)</p>
                <ul className="text-text-secondary text-sm mt-2 space-y-1 font-sans list-disc ml-4">
                  {tipografia.regras.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {tipografia.familias.map((font) => (
              <div key={font.name} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground font-sans">{font.name}</span>
                  <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono">{font.class}</code>
                </div>
                <p className={`text-lg text-text-secondary ${font.class}`}>{font.sample}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {font.usos.map((uso) => (
                    <span key={uso} className="text-xs px-2 py-1 rounded bg-muted text-text-secondary font-sans">{uso}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ============================================
            CORES
            ============================================ */}
        <Section title="CORES">
          <div className="space-y-8">
            {Object.entries(coresBase).map(([categoria, cores]) => (
              <div key={categoria}>
                <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">{categoria}</p>
                <div className="grid gap-2">
                  {cores.map((cor) => <ColorSwatch key={cor.name} {...cor} />)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ============================================
            LINKS POR TIPO DE ENTIDADE
            ============================================ */}
        <Section title="LINKS POR TIPO DE ENTIDADE">
          <p className="text-text-secondary mb-4 font-sans">
            No texto de documentos, entidades são destacadas com cores específicas por tipo:
          </p>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-text-secondary font-sans leading-relaxed">
              Nesta data, foi verificada a presença da pessoa de NOME: <span className="text-[#d4789b] bg-[#72284b]/25 px-1 rounded">João Bernardo Guimarães Aversa</span>, 
              CPF: <span className="text-[#d4789b] bg-[#72284b]/25 px-1 rounded">013.511.976-65</span> na localidade de Belo Horizonte, 
              localizado no ENDEREÇO: <span className="text-[#f0c048] bg-[#d4a017]/20 px-1 rounded">Rua Major Lopes, NÚMERO: 37, BAIRRO: Barro Preto</span>. 
              O alvo foi visto em um VEÍCULO: <span className="text-[#4dd4e8] bg-[#00bcd4]/20 px-1 rounded">Corsa Sedan, PLACA: NPX-3031</span>, 
              nas imediações da empresa de RAZÃO SOCIAL: <span className="text-[#4dd4e8] bg-[#00bcd4]/20 px-1 rounded">JB Aversa Participações Ltda</span>.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#d4789b]" />
              <span className="text-sm text-text-secondary font-sans">Pessoa = Rosa #d4789b (texto) / #72284b (bg)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#f0c048]" />
              <span className="text-sm text-text-secondary font-sans">Endereço = Amarelo #f0c048 (texto) / #d4a017 (bg)</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-[#4dd4e8]" />
              <span className="text-sm text-text-secondary font-sans">Veículo = Ciano #4dd4e8 (texto) / #00bcd4 (bg)</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#4dd4e8]" />
              <span className="text-sm text-text-secondary font-sans">Empresa = Ciano #4dd4e8 (texto) / #00bcd4 (bg)</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted font-sans">
            * Cores de texto clareadas para atingir contraste WCAG AA (4.5:1 mínimo)
          </p>
        </Section>

        {/* ============================================
            PADRÕES DE BOTÕES
            ============================================ */}
        <Section title="PADROES DE BOTOES">
          <p className="text-text-secondary mb-4 font-sans">
            A cor e estilo do botão positivo muda conforme o contexto da ação:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-muted font-medium font-sans">Contexto</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium font-sans">Botão Negativo</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium font-sans">Botão Positivo</th>
                </tr>
              </thead>
              <tbody>
                {padroesBotoes.map((p, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-foreground font-sans">{p.contexto}</td>
                    <td className="py-3 px-4 text-text-secondary font-sans">{p.negativo}</td>
                    <td className="py-3 px-4 text-text-secondary font-sans">{p.positivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Exemplos de botões */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg border border-border text-foreground font-sans flex items-center gap-2 hover:bg-muted transition-colors">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button className="px-4 py-2 rounded-lg border border-border text-foreground font-sans flex items-center gap-2 hover:bg-muted transition-colors">
              <X className="w-4 h-4" /> Ignorar
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#3f9f76] text-white font-sans flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Check className="w-4 h-4" /> Vincular
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#3f9f76] text-white font-sans flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Check className="w-4 h-4" /> Criar
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#72284b] text-white font-sans flex items-center gap-2 hover:opacity-90 transition-opacity">
              <X className="w-4 h-4" /> Remover vinculação
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#00bcd4] text-white font-sans flex items-center gap-2 hover:opacity-90 transition-opacity">
              Tramitar
            </button>
          </div>
        </Section>

        {/* ============================================
            COMPONENTES
            ============================================ */}
        <Section title="COMPONENTES">
          <div className="space-y-4">
            {componentes.map((comp) => (
              <div key={comp.name} className="p-4 rounded-xl border border-border bg-card">
                <p className="text-foreground font-medium mb-2 font-sans">{comp.name}</p>
                <p className="text-text-secondary text-sm font-sans mb-3">{comp.estrutura}</p>
                <div className="flex flex-wrap gap-2">
                  {comp.detalhes.map((d, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-muted text-text-muted font-sans">{d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ============================================
            EXEMPLOS VISUAIS
            ============================================ */}
        <Section title="EXEMPLOS VISUAIS">

          {/* Tabs Underline - Interativo com animação */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Tabs (Underline)</p>
            <ExampleTabs />
          </div>

          {/* Toggle Buttons - Interativo */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Toggle Buttons</p>
            <ExampleToggle />
          </div>

          {/* Badge IA */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Badge IA</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3">
                <User className="w-5 h-5 text-text-muted" />
                <span className="text-foreground font-sans">Ministério Público de Minas Gerais</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground">
                  <Sparkles className="w-3 h-3" /> IA
                </span>
              </div>
            </div>
          </div>

          {/* Níveis de Risco */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Badges de Risco</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#fe473c]">Risco Crítico</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#ff9800]">Risco Alto</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ffc563]">Risco Médio</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">Risco Baixo</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Tags de Categoria</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-sans text-white bg-[#72284b]">preso</span>
              <span className="px-3 py-1 rounded-md text-xs font-sans text-white bg-[#00bcd4]">visitante</span>
              <span className="px-3 py-1 rounded-md text-xs font-sans text-white bg-[#3f9f76]">advogado</span>
              <span className="px-3 py-1 rounded-md text-xs font-sans text-black bg-[#ffc563]">familiar</span>
              <span className="px-3 py-1 rounded-md text-xs font-sans text-white bg-[#ff9800]">ex-preso</span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Badges de Status</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">NOVO</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ffc563]">PRIORIDADE ALTA</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#72284b]">RASCUNHO</span>
              <span className="px-3 py-1 rounded-md text-xs font-sans text-foreground border border-border">INTERNO</span>
              <span className="px-3 py-1 rounded-md text-xs font-sans text-foreground border border-border">FORMALIZADO</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#fe473c]">URGENTE</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">SIGILOSO</span>
            </div>
          </div>

          {/* Ícones de Ação em Tabela */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Ícones de Ação (Tabela)</p>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Eye className="w-5 h-5 text-text-muted" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Download className="w-5 h-5 text-text-muted" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Trash2 className="w-5 h-5 text-[#72284b]" />
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2 font-sans">Visualizar e Download = cinza | Excluir = rosa</p>
          </div>

          {/* Input */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Input</p>
            <div className="relative max-w-md">
              <input 
                type="text" 
                placeholder="Buscar pessoa..."
                className="w-full bg-[#000000] border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-subtle font-sans focus:outline-none focus:ring-2 focus:ring-[#72284b]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            </div>
            <p className="text-xs text-text-muted mt-2 font-sans">Background: #000000 (preto puro), Borda: #2a2a2a</p>
          </div>

        </Section>

        {/* ============================================
            MODAIS (Dialog/Popup)
            ============================================ */}
        <Section title="MODAIS (DIALOG / POPUP)">
          <div className="space-y-6">
            {/* Regras */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Estrutura e Regras de Modais</p>
              <ul className="text-sm text-text-secondary space-y-2 font-sans list-disc ml-4">
                <li><strong>Background:</strong> #101112</li>
                <li><strong>Borda:</strong> #2A2B35, 1px</li>
                <li><strong>Border-radius modal:</strong> 12px</li>
                <li><strong>Header:</strong> Padding 16px 24px (compacto)</li>
                <li><strong>Título:</strong> Cygnito UPPERCASE, 18px</li>
                <li><strong>Linha separadora do header:</strong> #2A2B35, 1px (mesma cor da borda)</li>
                <li><strong>Padding do conteúdo:</strong> 24px</li>
                <li><strong>Select:</strong> Background #2A2B35, border-radius 8px</li>
                <li><strong>Tabs:</strong> Underline 8px altura, SEM border-radius, cor da vertical</li>
                <li><strong>Input/Textarea:</strong> Background #000000, borda #2A2B35</li>
                <li><strong>Alert box:</strong> Background #2A2B35, borda verde (success), border-radius 6px</li>
                <li><strong>Card de dados:</strong> Background #000000, borda #2A2B35</li>
                <li><strong>Botões:</strong> Sempre alinhados à <strong>DIREITA</strong>, border-radius <strong>6px</strong>, layout interno: ícone à ESQUERDA + texto à DIREITA (justify-between)</li>
                <li><strong>Margem botões:</strong> Mínimo de <strong>36px</strong> entre o conteúdo acima e os botões de ação</li>
                <li><strong>Botão Cancelar:</strong> OUTLINE - background transparente, borda #676C70 (cinza claro)</li>
                <li><strong>Botão Primário:</strong> Background cor da vertical (#72284b), texto bold</li>
                <li><strong>Overlay:</strong> Background #000000 com opacidade 50%</li>
              </ul>
              
              {/* Regras de Acessibilidade WCAG */}
              <div className="mt-6 p-4 bg-[#1a2b1f] border border-[#3f9f76] rounded-lg">
                <h4 className="text-sm font-bold text-[#3f9f76] mb-2 font-sans">Regras de Acessibilidade (WCAG AA)</h4>
                <ul className="text-sm text-text-secondary space-y-1 font-sans">
                  <li><strong>Contraste mínimo texto:</strong> 4.5:1 para texto normal, 3:1 para texto grande (18px+)</li>
                  <li><strong>Texto sobre fundo escuro:</strong> Usar versões clareadas das cores (ex: #d4789b ao invés de #72284b)</li>
                  <li><strong>Badges com fundo sólido:</strong> Usar texto branco ou preto conforme luminosidade do fundo</li>
                  <li><strong>Links inline:</strong> Texto clareado + background sutil da cor base com 20-25% opacidade</li>
                </ul>
              </div>
            </div>

            {/* Exemplo de Modal - Tramitar Processo (Interativo) */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-muted font-sans uppercase tracking-wide">Exemplo: Modal Tramitar Processo (Interativo)</p>
              <TramitarModal />
            </div>

            {/* Exemplo de Modal - Verificação de Entidade */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-muted font-sans uppercase tracking-wide">Exemplo: Modal Verificação de Entidade</p>
              {/* Modal: background #101112, borda #2A2B35, 1px */}
              <div className="bg-[#101112] rounded-xl border border-[#2a2b35] max-w-md mx-auto overflow-hidden">
                {/* Header compacto */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#72284b]" />
                      <span className="font-title text-[18px]">VERIFICACAO DE ENTIDADE</span>
                    </div>
                    <button className="p-1 rounded hover:bg-[#2a2b35] transition-colors">
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* Linha separadora do header - mesma cor da borda */}
                <div className="h-[1px] bg-[#2a2b35]" />

                {/* Conteúdo */}
                <div className="p-6">
                  {/* Mensagem com check verde */}
                  <div className="flex items-start gap-3 mb-4">
                    <Check className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <p className="text-foreground text-sm font-sans">
                      A entidade não foi encontrada no banco de dados! <strong className="text-foreground cursor-pointer hover:underline">Deseja criar uma nova?</strong>
                    </p>
                  </div>

                  {/* Card de dados */}
                  <div className="bg-[#000000] rounded-lg border border-[#2a2b35] overflow-hidden mb-4">
                    <div className="text-sm font-sans divide-y divide-[#2a2b35]">
                      <div className="flex px-4 py-3"><span className="text-foreground font-medium w-28">UF:</span><span className="text-text-muted">MG</span></div>
                      <div className="flex px-4 py-3"><span className="text-foreground font-medium w-28">CEP:</span><span className="text-text-muted">30.431-214</span></div>
                      <div className="flex px-4 py-3"><span className="text-foreground font-medium w-28">Bairro:</span><span className="text-text-muted">Barro Preto</span></div>
                      <div className="flex px-4 py-3"><span className="text-foreground font-medium w-28">Cidade:</span><span className="text-text-muted">Belo Horizonte</span></div>
                      <div className="flex px-4 py-3"><span className="text-foreground font-medium w-28">Número:</span><span className="text-text-muted">37</span></div>
                      <div className="flex px-4 py-3"><span className="text-foreground font-medium w-28">Logradouro:</span><span className="text-text-muted">Belo Horizonte</span></div>
                    </div>
                  </div>

                  {/* Link Ver detalhes - margem de 36px (mb-9) antes dos botões */}
                  <div className="flex items-center gap-2 mb-9">
                    <Search className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted cursor-pointer hover:underline font-sans">Ver detalhes</span>
                  </div>

                  {/* Botões - SEMPRE à direita, radius 6px, ícone esquerda + texto direita */}
                  <div className="flex items-center justify-end gap-3">
                    <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-sm font-bold font-sans hover:bg-[#2a2b35] transition-colors">
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                    <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-[#72284b] text-white text-sm font-bold font-sans hover:bg-[#5a1f3c] transition-colors">
                      <Check className="w-4 h-4" />
                      <span>Confirmar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemplo de Modal - Difusão */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-muted font-sans uppercase tracking-wide">Exemplo: Modal Difusão de Processo</p>
              {/* Modal: background #101112, borda #2A2B35, 1px */}
              <div className="bg-[#101112] rounded-xl border border-[#2a2b35] max-w-md mx-auto overflow-hidden">
                {/* Header compacto */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-success" />
                      <span className="font-title text-[18px]">DIFUSAO DE PROCESSO</span>
                    </div>
                    <button className="p-1 rounded hover:bg-[#2a2b35] transition-colors">
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* Linha separadora do header - mesma cor da borda */}
                <div className="h-[1px] bg-[#2a2b35]" />

                {/* Conteúdo */}
                <div className="p-6">
                  {/* Tabs - underline 8px ACIMA da linha base */}
                  <div className="mb-4 relative">
                    {/* Linha base - fica no fundo (z-0) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#2a2b35] z-0" />
                    <div className="flex gap-6">
                      <button className="flex items-center gap-2 text-text-muted text-sm font-sans pb-5">
                        <Search className="w-4 h-4" />
                        Sigiloso
                      </button>
                      <button className="flex items-center gap-2 text-foreground text-sm font-sans relative pb-5">
                        <svg className="w-4 h-4 text-[#72284b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="font-semibold">Reservado</span>
                        {/* Underline ACIMA da linha (z-10) */}
                        <div className="absolute bottom-0 left-0 right-0 h-[8px] bg-[#72284b] z-10" />
                      </button>
                      <button className="flex items-center gap-2 text-text-muted text-sm font-sans pb-5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                        Público
                      </button>
                    </div>
                  </div>

                  {/* Alert box - com borda verde */}
                  <div className="bg-[#2a2b35] rounded-[6px] border border-success p-4 mb-4">
                    <p className="text-sm text-text-secondary font-sans">
                      SUBSEC e SUP-CONTRA-INTEL são obrigatórios e não podem ser desmarcados.
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="bg-[#000000] border border-[#2a2b35] rounded-lg px-4 py-3 flex items-center gap-2 mb-4">
                    <span className="text-text-muted text-sm font-sans">Buscar pessoa</span>
                    <Search className="w-4 h-4 text-text-muted ml-auto" />
                  </div>

                  {/* Lista expansível (Accordion) - Interativo */}
                  <div className="mb-9">
                    <DifusaoAccordion />
                  </div>

                  {/* Botões - SEMPRE à direita, radius 6px, ícone esquerda + texto direita */}
                  <div className="flex items-center justify-end gap-3">
                    <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-sm font-bold font-sans hover:bg-[#2a2b35] transition-colors">
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                    <button className="w-[180px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-[#72284b] text-white text-sm font-bold font-sans hover:bg-[#5a1f3c] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>Confirmar difusão</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipos de Modais */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Tipos de Modais Identificados</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
                <div>
                  <p className="text-text-muted mb-1">Tramitar Processo</p>
                  <p className="text-text-secondary">Select + Tabs (underline) + Textarea + Botões</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Verificação de Entidade</p>
                  <p className="text-text-secondary">Status (check/warning) + Card dados + Link + Botões</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Difusão de Processo</p>
                  <p className="text-text-secondary">Tabs + Alert box + Search + Lista expansível + Botões</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Novo Documento</p>
                  <p className="text-text-secondary">Input + Selects (grid 2 colunas) + Select template + Botões</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Busca Inteligente</p>
                  <p className="text-text-secondary">Search input + Lista sugestões com Badge IA + Seleção direta</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================
            CARDS
            ============================================ */}
        <Section title="CARDS">
          <div className="space-y-6">
            {/* Regras */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Estrutura e Regras de Cards</p>
              <ul className="text-sm text-text-secondary space-y-2 font-sans list-disc ml-4">
                <li><strong>Background:</strong> #1a1a1a (card)</li>
                <li><strong>Borda:</strong> #2A2B35, 1px</li>
                <li><strong>Border-radius:</strong> 12px</li>
                <li><strong>Largura:</strong> ~340px (compacto)</li>
                <li><strong>Padding geral:</strong> 20px (p-5)</li>
                <li><strong>Header:</strong> Ícone 20px (cor da vertical) + Título (Inter/Sans, 18px, font-medium, capitalize)</li>
                <li><strong>Linha separadora:</strong> #2A2B35, 1px, com <strong>margem horizontal de 20px</strong> (mx-5)</li>
                <li><strong>Área de destaque:</strong> Background #2A2B35, border-radius 8px, padding px-3 py-2, texto 12px itálico</li>
                <li><strong>Lista de campos:</strong> Label (bold, 12px, w-20) + Valor (regular, 12px), espaçamento vertical 4px (space-y-1)</li>
                <li><strong>Botões:</strong> Alinhados à <strong>ESQUERDA</strong>, largura 110px, texto 12px, gap-2</li>
                <li><strong>Margem botões:</strong> <strong>24px</strong> (mb-6) entre o conteúdo e os botões</li>
              </ul>
              
              {/* Diferenças entre Card e Modal */}
              <div className="mt-6 p-4 bg-[#1a2b3f] border border-[#3f7fbf] rounded-lg">
                <h4 className="text-sm font-bold text-[#3f7fbf] mb-2 font-sans">Diferenças: Card vs Modal</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary font-sans">
                  <div>
                    <p className="text-foreground font-medium mb-1">Card</p>
                    <ul className="space-y-1 list-disc ml-4">
                      <li>Botões à ESQUERDA</li>
                      <li>Margem botões: 24px</li>
                      <li>Linha separadora: mx-5</li>
                      <li>Título: Sans 18px capitalize</li>
                      <li>Texto: 12px</li>
                      <li>Inline na página</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-foreground font-medium mb-1">Modal</p>
                    <ul className="space-y-1 list-disc ml-4">
                      <li>Botões à DIREITA</li>
                      <li>Margem botões: 36px</li>
                      <li>Linha separadora: full-width</li>
                      <li>Título: Cygnito 18px UPPERCASE</li>
                      <li>Texto: 14px</li>
                      <li>Overlay + centralizado</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemplo de Card - Endereço */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-muted font-sans uppercase tracking-wide">Exemplo: Card de Entidade (Endereço)</p>
              
              {/* Card */}
              <div className="bg-card rounded-xl border border-border w-[340px] overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#72284b]" />
                    <span className="font-sans text-[18px] font-medium text-foreground">Endereço</span>
                  </div>
                </div>
                
                {/* Linha separadora com margem horizontal de 24px */}
                <div className="mx-5 h-[1px] bg-[#2a2b35]" />

                {/* Conteúdo */}
                <div className="p-5">
                  {/* Área de destaque */}
                  <div className="bg-[#2a2b35] rounded-lg px-3 py-2 mb-4">
                    <p className="text-text-secondary text-xs font-sans italic leading-relaxed">
                      Nome: João Francisco Santo Pereira Salviano Bernardo Guimarães Aversa, CPF: 013.511.976-65
                    </p>
                  </div>

                  {/* Lista de campos */}
                  <div className="space-y-1 mb-6">
                    <div className="flex">
                      <span className="text-foreground font-bold text-xs w-20 font-sans">UF:</span>
                      <span className="text-text-secondary text-xs font-sans">MG</span>
                    </div>
                    <div className="flex">
                      <span className="text-foreground font-bold text-xs w-20 font-sans">CEP:</span>
                      <span className="text-text-secondary text-xs font-sans">30.431-214</span>
                    </div>
                    <div className="flex">
                      <span className="text-foreground font-bold text-xs w-20 font-sans">Bairro:</span>
                      <span className="text-text-secondary text-xs font-sans">Barro Preto</span>
                    </div>
                    <div className="flex">
                      <span className="text-foreground font-bold text-xs w-20 font-sans">Cidade:</span>
                      <span className="text-text-secondary text-xs font-sans">Belo Horizonte</span>
                    </div>
                    <div className="flex">
                      <span className="text-foreground font-bold text-xs w-20 font-sans">Número:</span>
                      <span className="text-text-secondary text-xs font-sans">37</span>
                    </div>
                    <div className="flex">
                      <span className="text-foreground font-bold text-xs w-20 font-sans">Logradouro:</span>
                      <span className="text-text-secondary text-xs font-sans">Rua Major Lopes</span>
                    </div>
                  </div>

                  {/* Botões - alinhados à ESQUERDA, margem de 24px (mb-6 acima) */}
                  <div className="flex items-center justify-start gap-2">
                    <button className="w-[110px] flex items-center justify-between px-3 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-xs font-bold font-sans hover:bg-[#2a2b35] transition-colors">
                      <X className="w-3.5 h-3.5" />
                      <span>Ignorar</span>
                    </button>
                    <button className="w-[110px] flex items-center justify-between px-3 py-2 rounded-[6px] bg-[#72284b] text-white text-xs font-bold font-sans hover:bg-[#5a1f3c] transition-colors">
                      <Check className="w-3.5 h-3.5" />
                      <span>Vincular</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipos de Cards */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Tipos de Cards Identificados</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
                <div>
                  <p className="text-text-muted mb-1">Card de Entidade</p>
                  <p className="text-text-secondary">Header (ícone + título) + Área destaque + Lista campos + Botões</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Card de Resultado de Busca</p>
                  <p className="text-text-secondary">Header + Dados resumidos + Ação (vincular/ignorar)</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Card de Documento</p>
                  <p className="text-text-secondary">Header + Preview/Resumo + Metadados + Ações</p>
                </div>
                <div>
                  <p className="text-text-muted mb-1">Card de Alerta</p>
                  <p className="text-text-secondary">Ícone status + Mensagem + Ações rápidas</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================
            TOASTS / NOTIFICAÇÕES
            ============================================ */}
        <Section title="TOASTS / NOTIFICAÇÕES">
          <div className="space-y-6">
            {/* Regras */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Regras de Toasts</p>
              <ul className="text-sm text-text-secondary space-y-2 font-sans list-disc ml-4">
                <li><strong>Background:</strong> Cor semântica escura (verde #1a4d3a, vermelho #5c1a1a, amarelo #4d3a1a)</li>
                <li><strong>Borda:</strong> 2px, cor mais clara/luminosa que o background (ex: #5b9781 para verde)</li>
                <li><strong>Border-radius:</strong> 8px (regular) ou 6px (compacto)</li>
                <li><strong>Ícone:</strong> Dentro de círculo BRANCO, ícone na cor do background</li>
                <li><strong>Texto:</strong> Branco, Inter Tight</li>
                <li><strong>Posição:</strong> Geralmente top-right ou bottom-center</li>
                <li><strong>Tamanhos:</strong> Regular (padding 16px 20px) e Compacto (padding 12px 16px)</li>
                <li><strong>Duração:</strong> Auto-dismiss após 3-5 segundos</li>
              </ul>
            </div>

            {/* Exemplos de Toasts */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-muted font-sans uppercase tracking-wide">Exemplos de Toasts</p>
              
              <div className="flex flex-col gap-4 max-w-md">
                {/* Toast Sucesso - Regular */}
                <div className="bg-[#1a4d3a] rounded-[8px] border-2 border-[#5b9781] px-5 py-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-[#1a4d3a]" />
                  </div>
                  <span className="text-white text-base font-sans">Processo criado com sucesso.</span>
                </div>

                {/* Toast Sucesso - Compacto */}
                <div className="bg-[#1a4d3a] rounded-[6px] border-2 border-[#5b9781] px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#1a4d3a]" />
                  </div>
                  <span className="text-white text-sm font-sans">Processo criado com sucesso.</span>
                </div>

                {/* Toast Erro - Regular */}
                <div className="bg-[#5c1a1a] rounded-[8px] border-2 border-[#a15050] px-5 py-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-[#5c1a1a]" />
                  </div>
                  <span className="text-white text-base font-sans">Erro ao criar processo. Tente novamente.</span>
                </div>

                {/* Toast Warning - Regular */}
                <div className="bg-[#4d3a1a] rounded-[8px] border-2 border-[#9a7a50] px-5 py-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-[#4d3a1a]" />
                  </div>
                  <span className="text-white text-base font-sans">Atenção: campos obrigatórios não preenchidos.</span>
                </div>
              </div>
            </div>

            {/* Variantes */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Variantes de Toast</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-sans">
                <div>
                  <p className="text-success mb-1">Sucesso</p>
                  <p className="text-text-secondary">Background #1a4d3a, borda #5b9781</p>
                </div>
                <div>
                  <p className="text-red-500 mb-1">Erro</p>
                  <p className="text-text-secondary">Background #5c1a1a, borda #a15050</p>
                </div>
                <div>
                  <p className="text-yellow-500 mb-1">Warning</p>
                  <p className="text-text-secondary">Background #4d3a1a, ícone alerta</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================
            TABELAS (DataTable)
            ============================================ */}
        <Section title="TABELAS (DATATABLE)">
          <div className="space-y-6">
            {/* Regras */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-3 font-sans">Regras de Tabela</p>
              <ul className="text-sm text-text-secondary space-y-2 font-sans list-disc ml-4">
                <li><strong>Header:</strong> Texto cinza médio (#888888), sem background destacado, font-weight medium</li>
                <li><strong>Rows:</strong> Sem bordas entre linhas (estilo clean/minimal)</li>
                <li><strong>Altura de row:</strong> 40-48px</li>
                <li><strong>Hover:</strong> Background sutil (#1a1a1a para #242424)</li>
                <li><strong>Ações:</strong> Sempre alinhadas à direita</li>
                <li><strong>Ícones de ação:</strong> Visualizar/Download = cinza | Excluir = rosa #72284b</li>
                <li><strong>Checkbox:</strong> Se houver seleção, à esquerda de cada row</li>
              </ul>
            </div>

            {/* Exemplo de Tabela */}
            <div className="rounded-xl border border-border overflow-hidden">
              {/* DropZone acima da tabela */}
              <div className="p-6 border-b border-dashed border-text-muted text-center">
                <p className="text-text-secondary font-sans">Para <strong>anexar arquivos</strong>, arraste-o(s) para essa área</p>
                <p className="text-text-muted text-sm font-sans">Ou clique para selecionar manualmente</p>
              </div>

              {/* Tabela */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Arquivo</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Tamanho</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Data de criação</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Data de modificação</th>
                    <th className="text-right py-3 px-4 text-text-muted font-medium text-sm font-sans">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nome: "Relatório Especial de Inteligência.PDF", tamanho: "55 MegaBytes", criacao: "02/04/2026 10:35", modificacao: "02/04/2026 16:50" },
                    { nome: "Arquivo de provas selecionadas v2", tamanho: "55 MegaBytes", criacao: "02/04/2026 10:35", modificacao: "02/04/2026 16:50" },
                    { nome: "Diagnóstico de investigação", tamanho: "55 MegaBytes", criacao: "02/04/2026 10:35", modificacao: "02/04/2026 16:50" },
                  ].map((arquivo, i) => (
                    <tr key={i} className="border-b border-border hover:bg-card-hover transition-colors" style={{ height: "48px" }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-text-muted" />
                          <span className="text-foreground text-sm font-sans">{arquivo.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-sans">{arquivo.tamanho}</td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-sans">{arquivo.criacao}</td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-sans">{arquivo.modificacao}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Eye className="w-4 h-4 text-text-muted" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Download className="w-4 h-4 text-text-muted" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Trash2 className="w-4 h-4 text-[#72284b]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-foreground font-sans">
                <ArrowLeft className="w-4 h-4" />
                Página anterior
              </button>
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 text-sm text-text-muted font-sans">1</span>
                <span className="px-2 text-text-muted">...</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">3</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">4</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">5</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">6</span>
                <span className="px-3 py-1 text-sm text-foreground font-bold font-sans bg-muted rounded">7</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">8</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">9</span>
                <span className="px-2 text-text-muted">...</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">25</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-foreground font-sans">
                Próxima página
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </Section>

        {/* ============================================
            ESPAÇAMENTOS
            ============================================ */}
        <Section title="ESPACAMENTOS">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {espacamentos.map((e) => (
              <div key={e.nome} className="p-4 rounded-xl border border-border bg-card">
                <p className="text-text-muted text-xs font-sans mb-1">{e.nome}</p>
                <p className="text-foreground font-mono text-lg">{e.valor}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ============================================
            BORDER RADIUS
            ============================================ */}
        <Section title="BORDER RADIUS">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {borderRadius.map((r) => (
              <div key={r.nome} className="p-4 rounded-xl border border-border bg-card">
                <p className="text-text-muted text-xs font-sans mb-1">{r.nome}</p>
                <p className="text-foreground font-mono">{r.valor}</p>
                <code className="text-xs text-text-subtle font-mono">{r.classe}</code>
              </div>
            ))}
          </div>
        </Section>

      </main>
    </div>
  )
}
