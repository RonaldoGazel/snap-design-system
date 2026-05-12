"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Check, Copy, User, MapPin, Car, Building, AlertTriangle, Sparkles, X, Eye, Download, Trash2, Search, FileText, Calendar, ArrowLeft, RefreshCw, Sun, Moon, Shield, Lock, ChevronDown, ChevronRight, Settings, Link2, Share2 } from "lucide-react"
import { SnapButton, SnapButtonGroup } from "@/components/snap/snap-button"
import { SnapThemeToggle } from "@/components/snap/snap-theme-toggle"
import { SnapLogo } from "@/components/snap/snap-logo"
import { SnapHeader } from "@/components/snap/snap-header"
import { useTheme } from "@/hooks/use-theme"

/* ============================================
   SNAP DESIGN SYSTEM
   Consolidado a partir de 7+ telas de referência do Figma
   ============================================ */

// Verticais do Ecossistema SNAP (cores oficiais)
const verticais = [
{ name: "INVESTIGAÇÃO", color: "#FE473C", colorName: "Coral", icon: "Lupa" },
{ name: "INTELIGÊNCIA", color: "#72284B", colorName: "Bordô", icon: "Cabeça/Cérebro" },
{ name: "COOPERAÇÃO", color: "#889EA3", colorName: "Grey Ahead", icon: "Pessoas" },
{ name: "INFRAESTRUTURA", color: "#287266", colorName: "Petroleum Blue", icon: "Nós conectados" },
{ name: "ADMINISTRAÇÃO", color: "#333540", colorName: "Deep Gray Blue", icon: "Pessoa com engrenagem" },
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

// Componente Sidebar Demo para documentação - IDÊNTICO à implementação real em /administracao/usuarios
function SidebarDemo() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarContentVisible, setSidebarContentVisible] = useState(false)
  const [inteligenciaExpanded, setInteligenciaExpanded] = useState(true)
  const [administracaoExpanded, setAdministracaoExpanded] = useState(true)
  
  const VERTICAL_COLOR = "#333540" // Deep Gray Blue - Administração
  
  const handleSidebarOpen = () => {
    setSidebarOpen(true)
    setTimeout(() => setSidebarContentVisible(true), 200)
  }
  
  const handleSidebarClose = () => {
    setSidebarContentVisible(false)
    setTimeout(() => setSidebarOpen(false), 50)
  }

  return (
    <aside 
      onMouseEnter={handleSidebarOpen}
      onMouseLeave={handleSidebarClose}
      className="flex flex-col py-4 transition-all duration-300 border border-border rounded-xl bg-card dark:bg-[#0C0C0C] relative"
      style={{ 
        width: sidebarOpen ? '280px' : '64px',
        minWidth: sidebarOpen ? '280px' : '64px',
        height: '400px',
        boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.25)' : 'none'
      }}
    >
      {/* Sidebar Fechada */}
      {!sidebarOpen && (
        <>
          <nav className="flex-1 flex flex-col items-center gap-2">
            {/* Inteligência - idle */}
            <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
              <Shield className="w-5 h-5" />
            </button>
            {/* Administração - PÁGINA ATUAL = cor da vertical */}
            <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: VERTICAL_COLOR }}>
              <Lock className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
              <FileText className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
              <Link2 className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
              <Share2 className="w-5 h-5" />
            </button>
          </nav>
          <div className="w-8 mx-auto my-2 border-t border-border" />
          <button className="p-3 rounded-lg hover:opacity-80 transition-opacity mx-auto text-muted-foreground">
            <Settings className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Sidebar Aberta - conteúdo aparece após expansão */}
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
                <span className="font-sans text-sm font-medium text-muted-foreground">Inteligência</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${inteligenciaExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {inteligenciaExpanded && (
              <div className="mt-1 space-y-1" style={{ paddingLeft: '54px', paddingRight: '12px' }}>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm text-muted-foreground">Pessoas</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm text-muted-foreground">Documentos</span>
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
                <span className="font-sans text-sm font-medium" style={{ color: VERTICAL_COLOR }}>Administração</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${administracaoExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {administracaoExpanded && (
              <div className="mt-1 space-y-1" style={{ paddingLeft: '54px', paddingRight: '12px' }}>
                {/* Usuários - PÁGINA ATUAL = fundo da cor da vertical */}
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: VERTICAL_COLOR }}>
                  <User className="w-4 h-4 text-white" />
                  <span className="font-sans text-sm text-white">Usuários</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm text-muted-foreground">Grupos</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Rodapé */}
          <div className="mt-auto border-t border-border pt-2" style={{ paddingLeft: '10px', paddingRight: '16px' }}>
            <button className="w-full flex items-center gap-3 py-2 rounded-lg hover:opacity-80 transition-opacity">
              <div className="w-11 flex justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-sans text-sm text-muted-foreground">Configurações</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

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
              className={`w-full flex items-center gap-3 p-2 hover:bg-border transition-colors cursor-pointer ${
                isOpen ? 'bg-border rounded-t-lg' : 'rounded-lg'
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
              <div className="bg-muted border-x border-b border-border rounded-b-lg max-h-[140px] overflow-y-auto scrollbar-minimal">
                <div className="p-2 space-y-1">
                  {section.items.map((item) => {
                    const isChecked = checkedItems[item.id] || item.checked
                    return (
                      <label 
                        key={item.id}
                        onClick={() => toggleCheckbox(item.id, item.disabled)}
                        className={`flex items-center gap-3 p-2 hover:bg-border rounded ${item.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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

// Dados das Tabs do modal Difusão
const difusaoTabs = [
  { id: 'sigiloso', label: 'Sigiloso', icon: 'Search' },
  { id: 'reservado', label: 'Reservado', icon: 'Lock' },
  { id: 'publico', label: 'Público', icon: 'Globe' },
]

// Componente Tabs Interativo para Modal Difusão
function DifusaoTabsComponent() {
  const [activeTab, setActiveTab] = useState('reservado')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeIndex = difusaoTabs.findIndex(t => t.id === activeTab)
    const activeTabElement = tabRefs.current[activeIndex]
    if (activeTabElement) {
      setTabIndicator({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      })
    }
  }, [activeTab])

  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `w-4 h-4 ${isActive ? 'text-[#72284b]' : ''}`
    switch (iconName) {
      case 'Search':
        return <Search className={iconClass} />
      case 'Lock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      case 'Globe':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative">
      {/* Linha base */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border z-0" />
      <div className="flex gap-6">
        {difusaoTabs.map((tab, index) => {
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
    <div className="bg-card rounded-xl border border-border max-w-md mx-auto overflow-hidden">
      {/* Header compacto */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#72284b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="font-title text-[18px]">TRAMITAR PROCESSO</span>
          </div>
          <button className="p-1 rounded hover:bg-border transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>
      
      {/* Linha separadora do header */}
      <div className="h-[1px] bg-border" />

      {/* Conteúdo */}
      <div className="p-6">
        {/* Select Interativo - Estilo Accordion */}
        <div className="mb-6">
          <label className="text-sm text-foreground mb-2 block font-sans">
            Selecione um destinatário <span className="text-foreground">*</span>
          </label>
          <div className="bg-border border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectOpen(!selectOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
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
              className={`bg-muted overflow-hidden transition-all duration-200 ease-out ${
                selectOpen ? 'max-h-[160px] border-t border-border' : 'max-h-0'
              }`}
            >
              <div className="overflow-y-auto max-h-[160px] scrollbar-minimal">
                {destinatarios.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-4 py-3 text-sm font-sans hover:bg-border transition-colors ${
                      option === selectedDestinatario 
                        ? 'text-foreground bg-border' 
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
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border z-0" />
          
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
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-text-secondary font-sans resize-none focus:border-[#72284b] focus:outline-none transition-colors"
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
        <div className="flex items-center justify-end gap-4">
          <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-sm font-bold font-sans hover:bg-border transition-colors">
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
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border z-0" />
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

// Gera ID a partir do título
function generateId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Componente Section
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = generateId(title)
  return (
    <section id={id} className="mb-12 scroll-mt-32">
      <h2 className="text-xl text-foreground mb-6 pb-2 border-b border-border">{title}</h2>
      {children}
    </section>
  )
}

// Índice de navegação
const indice = [
  { titulo: 'Marca SNAP', id: 'marca-snap' },
  { titulo: 'Verticais do Ecossistema', id: 'verticais-do-ecossistema-snap' },
  { titulo: 'Tipografia', id: 'tipografia' },
  { titulo: 'Cores das Verticais', id: 'cores-das-verticais' },
  { titulo: 'Cores Base', id: 'cores-base' },
  { titulo: 'Links por Entidade', id: 'links-por-tipo-de-entidade' },
  { titulo: 'Padrões de Botões', id: 'padroes-de-botoes' },
  { titulo: 'Componentes', id: 'componentes' },
  { titulo: 'Exemplos Visuais', id: 'exemplos-visuais' },
  { titulo: 'Modais', id: 'modais-dialog-popup' },
  { titulo: 'Cards', id: 'cards' },
  { titulo: 'Toasts', id: 'toasts-notificacoes' },
  { titulo: 'Tabelas', id: 'tabelas-datatable' },
  { titulo: 'Espaçamentos', id: 'espacamentos' },
  { titulo: 'Border Radius', id: 'border-radius' },
  { titulo: 'Aplicativos Derivados', id: 'aplicativos-derivados' },
  { titulo: 'Componentes Portáveis', id: 'componentes-snap' },
]

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header da Documentação - estrutura simples, sem sidebar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-title text-3xl text-foreground tracking-wide">SNAP DESIGN SYSTEM</h1>
              <p className="text-sm text-text-muted font-sans mt-1">Documentação base do Ecossistema SNAP</p>
            </div>
            <div className="flex items-center gap-4">
              <SnapThemeToggle />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FE473C]" title="Investigação" />
                <div className="w-3 h-3 rounded-full bg-[#72284B]" title="Inteligência" />
                <div className="w-3 h-3 rounded-full bg-[#889EA3]" title="Cooperação" />
                <div className="w-3 h-3 rounded-full bg-[#287266]" title="Infraestrutura" />
                <div className="w-3 h-3 rounded-full bg-[#333540]" title="Administração" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Índice de Navegação - Nível 1 (Base) */}
        <nav className="mb-12 p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground font-sans">Índice - Design System Base</h2>
            <a 
              href="/design-system/snap-graph" 
              className="text-sm text-[#696969] hover:text-foreground transition-colors font-sans flex items-center gap-2"
            >
              Ver SNAP Graph →
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {indice.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-text-secondary hover:text-[#72284b] font-sans transition-colors py-1"
              >
                {item.titulo}
              </a>
            ))}
          </div>
        </nav>

        {/* ============================================
            MARCA SNAP
            ============================================ */}
        <Section title="MARCA SNAP">
          <p className="text-text-secondary mb-4 font-sans">
            Logo principal do Ecossistema SNAP. Aplicável em todas as verticais e áreas do sistema. 
            <strong className="text-foreground"> O logo alterna automaticamente entre versões dark/light.</strong>
          </p>
          
          {/* Preview dinâmico com SnapLogo */}
          <div className="mb-6 p-6 bg-card rounded-xl border border-border">
            <p className="text-xs text-text-muted mb-3 font-sans uppercase tracking-wide">Preview (alterna com o tema)</p>
            <div className="p-6 bg-background rounded-lg inline-block">
              <SnapLogo variant="snap" height={32} />
            </div>
          </div>
          
          {/* Documentação das duas versões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dark mode version */}
            <div className="p-4 bg-[#0a0a0a] rounded-xl border border-border">
              <p className="text-xs text-[#888] mb-3 font-sans uppercase tracking-wide">Dark Mode</p>
              <div className="flex items-center gap-4">
                <img src="/assets/snap-logo.svg" alt="SNAP Dark" className="h-8" />
                <div className="text-sm text-[#a0a0a0] font-sans space-y-1">
                  <p><strong className="text-white">Arquivo:</strong> /assets/snap-logo.svg</p>
                  <p><strong className="text-white">Cor:</strong> Branco (#FFFFFF)</p>
                </div>
              </div>
            </div>
            
            {/* Light mode version */}
            <div className="p-4 bg-[#F5F7F8] rounded-xl border border-[#d0d5d9]">
              <p className="text-xs text-[#6a6a6a] mb-3 font-sans uppercase tracking-wide">Light Mode</p>
              <div className="flex items-center gap-4">
                <img src="/assets/snap-logo-light.svg" alt="SNAP Light" className="h-8" />
                <div className="text-sm text-[#4a4a4a] font-sans space-y-1">
                  <p><strong className="text-black">Arquivo:</strong> /assets/snap-logo-light.svg</p>
                  <p><strong className="text-black">Cor:</strong> Preto (#000000)</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Uso do componente */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-xs text-text-muted mb-2 font-sans uppercase tracking-wide">Uso no código</p>
            <code className="text-sm text-foreground font-mono">{'<SnapLogo variant="snap" height={32} />'}</code>
          </div>
        </Section>

        {/* ============================================
            HEADER GLOBAL (SnapHeader)
            ============================================ */}
        <Section title="HEADER GLOBAL">
          <p className="text-text-secondary mb-4 font-sans">
            Componente de cabeçalho global utilizado em todas as telas do ecossistema SNAP. Contém navegação, breadcrumb, notificações e informações do usuário.
          </p>

          {/* Medidas do Header */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">MEDIDAS EXATAS (FIGMA)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-sans">
              <div>
                <span className="text-text-muted">Margem superior:</span>
                <span className="text-foreground ml-2">32px</span>
              </div>
              <div>
                <span className="text-text-muted">Margem inferior:</span>
                <span className="text-foreground ml-2">24px</span>
              </div>
              <div>
                <span className="text-text-muted">Margem esquerda ícone:</span>
                <span className="text-foreground ml-2">51px</span>
              </div>
              <div>
                <span className="text-text-muted">Gap ícone → logo:</span>
                <span className="text-foreground ml-2">70px</span>
              </div>
              <div>
                <span className="text-text-muted">Faixa colorida altura:</span>
                <span className="text-foreground ml-2">8px</span>
              </div>
              <div>
                <span className="text-text-muted">Faixa marginLeft:</span>
                <span className="text-foreground ml-2">144px</span>
              </div>
              <div>
                <span className="text-text-muted">Faixa marginRight:</span>
                <span className="text-foreground ml-2">32px</span>
              </div>
              <div>
                <span className="text-text-muted">Gaps lado direito:</span>
                <span className="text-foreground ml-2">32px (todos)</span>
              </div>
              <div>
                <span className="text-text-muted">Breadcrumb padding:</span>
                <span className="text-foreground ml-2">16px (top/bottom)</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4 font-sans">
              <strong>Estrutura:</strong> [Menu Grid] [Logo SNAP] ... [Notificações] [Tema] [Usuario] → Faixa colorida → Breadcrumb
            </p>
          </div>

          {/* Preview do Header - Administração */}
          <div className="mb-6">
            <p className="text-xs text-text-muted mb-2 font-sans uppercase tracking-wide">Vertical: Administração</p>
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <SnapHeader 
                vertical="administracao"
                breadcrumb={[{ label: "Usuários" }]}
                userName="Analista de Contrainteligência"
                userRole="Administrador"
                userInitials="VD"
                notificationCount={35}
              />
            </div>
          </div>

          {/* Preview do Header - Inteligência */}
          <div className="mb-6">
            <p className="text-xs text-text-muted mb-2 font-sans uppercase tracking-wide">Vertical: Inteligência</p>
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <SnapHeader 
                vertical="inteligencia"
                breadcrumb={[{ label: "Processos" }, { label: "Documentos" }]}
                userName="Coordenador de Inteligência"
                userRole="Supervisor"
                userInitials="RC"
                notificationCount={12}
              />
            </div>
          </div>

          {/* Props do Componente */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">PROPS DO COMPONENTE</p>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex">
                <code className="text-[#72284b] font-mono w-40">vertical</code>
                <span className="text-text-muted">Define a cor da vertical (administracao, inteligencia, investigacao, cooperacao, infraestrutura)</span>
              </div>
              <div className="flex">
                <code className="text-[#72284b] font-mono w-40">breadcrumb</code>
                <span className="text-text-muted">{"Array de { label, href? } para navegação"}</span>
              </div>
              <div className="flex">
                <code className="text-[#72284b] font-mono w-40">userName</code>
                <span className="text-text-muted">Nome do usuário logado</span>
              </div>
              <div className="flex">
                <code className="text-[#72284b] font-mono w-40">userRole</code>
                <span className="text-text-muted">Role/cargo do usuário</span>
              </div>
              <div className="flex">
                <code className="text-[#72284b] font-mono w-40">userInitials</code>
                <span className="text-text-muted">Iniciais para o avatar</span>
              </div>
              <div className="flex">
                <code className="text-[#72284b] font-mono w-40">notificationCount</code>
                <span className="text-text-muted">Número de notificações no badge</span>
              </div>
            </div>
          </div>

          {/* Uso no código */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-text-muted mb-2 font-sans uppercase tracking-wide">Uso no código</p>
            <pre className="text-sm text-foreground font-mono overflow-x-auto">
{`<SnapHeader 
  vertical="administracao"
  breadcrumb={[{ label: "Usuários" }]}
  userName="Analista de Contrainteligência"
  userRole="Administrador"
  userInitials="VD"
  notificationCount={35}
/>`}
            </pre>
          </div>
        </Section>

        {/* ============================================
            SIDEBAR GLOBAL
            ============================================ */}
        <Section title="SIDEBAR GLOBAL">
          <p className="text-text-secondary mb-4 font-sans">
            Componente de navegação lateral utilizado em todas as telas do ecossistema SNAP. Comportamento de hover para expandir, com verticais colapsáveis.
          </p>

          {/* Medidas da Sidebar */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">MEDIDAS E REGRAS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-sans">
              <div>
                <span className="text-text-muted">Largura fechada:</span>
                <span className="text-foreground ml-2">64px</span>
              </div>
              <div>
                <span className="text-text-muted">Largura aberta:</span>
                <span className="text-foreground ml-2">280px</span>
              </div>
              <div>
                <span className="text-text-muted">Margem esquerda:</span>
                <span className="text-foreground ml-2">32px</span>
              </div>
              <div>
                <span className="text-text-muted">Gap até conteúdo:</span>
                <span className="text-foreground ml-2">51px</span>
              </div>
              <div>
                <span className="text-text-muted">Background:</span>
                <span className="text-foreground ml-2">#0F0F10</span>
              </div>
              <div>
                <span className="text-text-muted">Border-radius:</span>
                <span className="text-foreground ml-2">12px</span>
              </div>
            </div>
          </div>

          {/* Demo Interativa da Sidebar */}
          <div className="mb-6">
            <p className="text-xs text-text-muted mb-2 font-sans uppercase tracking-wide">Demo interativa (hover para expandir)</p>
            <div className="flex gap-8 p-6 bg-background rounded-xl border border-border min-h-[400px]">
              {/* Sidebar Demo - implementada inline */}
              <SidebarDemo />
              
              {/* Conteúdo exemplo */}
              <div className="flex-1 p-4">
                <p className="text-sm text-text-muted font-sans">
                  Passe o mouse sobre a sidebar para ver o comportamento de expansão.
                  A sidebar abre como overlay, sem empurrar o conteúdo.
                </p>
              </div>
            </div>
          </div>

          {/* Comportamento */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">COMPORTAMENTO</p>
            <ul className="space-y-2 text-sm font-sans text-text-secondary">
              <li>• <strong>Hover</strong> para abrir/fechar (não clique)</li>
              <li>• Sidebar aberta é <strong>overlay</strong> (position absolute), conteúdo não move</li>
              <li>• Verticais são <strong>colapsáveis</strong> com chevron</li>
              <li>• Drop-shadow quando aberta: <code className="text-[#72284b]">4px 0 24px rgba(0, 0, 0, 0.5)</code></li>
            </ul>
          </div>

          {/* Cores dos Ícones */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">CORES DOS ÍCONES</p>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-text-muted">Idle/default:</span>
                <code className="text-foreground">text-muted-foreground</code>
              </div>
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5" style={{ color: '#333540' }} />
                <span className="text-text-muted">Vertical ativa (sidebar fechada):</span>
                <code className="text-foreground">Cor da vertical</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-2 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#333540' }}>
                  <User className="w-4 h-4 text-white" />
                  <span className="font-sans text-sm text-white">Usuários</span>
                </div>
                <span className="text-text-muted">Item selecionado (aberta):</span>
                <code className="text-foreground">Fundo cor vertical, texto branco</code>
              </div>
            </div>
          </div>

          {/* Ícones por Vertical */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-text-muted mb-3 font-sans uppercase tracking-wide">Ícones por vertical (Lucide)</p>
            <div className="grid grid-cols-2 gap-3 text-sm font-sans">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Inteligência:</span>
                <code className="text-foreground">Shield</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Administração:</span>
                <code className="text-foreground">Lock</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Investigação:</span>
                <code className="text-foreground">Search</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Cooperação:</span>
                <code className="text-foreground">Users</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Infraestrutura:</span>
                <code className="text-foreground">Network</code>
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================
            SELECTS (REGRAS GLOBAIS)
            ============================================ */}
        <Section title="SELECTS">
          <p className="text-text-secondary mb-4 font-sans">
            Regras para todos os selects do ecossistema SNAP. A setinha (chevron) sempre fica alinhada à direita do container.
          </p>

          {/* Regras */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">REGRAS DE LAYOUT</p>
            <ul className="space-y-2 text-sm font-sans text-text-secondary">
              <li>• Layout do botão: <code className="text-[#72284b]">flex items-center justify-between</code> (NUNCA gap-2)</li>
              <li>• Texto à esquerda, setinha (chevron) alinhada à direita do container</li>
              <li>• Largura mínima: definir <code className="text-[#72284b]">min-w-[Xpx]</code> para evitar select muito estreito</li>
              <li>• Border-radius: <code className="text-[#72284b]">8px (rounded-lg)</code></li>
              <li>• Chevron: rotação de 180° quando aberto (<code className="text-[#72284b]">rotate-180</code>)</li>
            </ul>
          </div>

          {/* Dropdown Flutuante */}
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="font-title text-lg mb-4">DROPDOWN FLUTUANTE (FORA DE MODAIS)</p>
            <ul className="space-y-2 text-sm font-sans text-text-secondary">
              <li>• Container: <code className="text-[#72284b]">relative</code></li>
              <li>• Dropdown: <code className="text-[#72284b]">absolute top-full left-0 mt-1 z-50</code></li>
              <li>• Isso faz o dropdown flutuar SOBRE o conteúdo sem empurrar</li>
            </ul>
          </div>

          {/* Código exemplo */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-text-muted mb-2 font-sans uppercase tracking-wide">Exemplo de código</p>
            <pre className="text-sm text-foreground font-mono overflow-x-auto whitespace-pre-wrap">
{`<div className="relative">
  <button className="flex items-center justify-between px-4 py-2 
    rounded-lg border border-border bg-card min-w-[180px]">
    <span>Opção selecionada</span>
    <ChevronDown className="w-4 h-4 rotate-180" />
  </button>
  
  <div className="absolute top-full left-0 mt-1 w-full 
    bg-card border border-border rounded-lg z-50">
    {/* Opções */}
  </div>
</div>`}
            </pre>
          </div>
        </Section>

        {/* ============================================
            TELAS DAS VERTICAIS
            ============================================ */}
        <Section title="TELAS DAS VERTICAIS">
          <p className="text-text-secondary mb-4 font-sans">
            Documentação visual das telas de cada vertical do ecossistema SNAP.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/design-system/administracao"
              className="bg-card rounded-xl border border-border p-6 hover:bg-card-hover transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#333540' }} />
                <h3 className="font-title text-lg text-foreground group-hover:opacity-80">ADMINISTRAÇÃO</h3>
              </div>
              <p className="text-sm text-text-muted font-sans">
                Usuários, Grupos, Papéis, Convites, Auditoria, Organizações
              </p>
            </Link>
          </div>
        </Section>

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
        <Section title="CORES DAS VERTICAIS">
          <div className="space-y-6">
            <p className="text-text-secondary font-sans">
              O Ecossistema SNAP possui 5 verticais, cada uma com sua cor primária identificadora:
            </p>
            
            {/* Grid de Verticais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Investigação */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FE473C]" />
                  <div>
                    <p className="font-sans font-bold text-foreground">Investigação</p>
                    <p className="text-xs text-text-muted font-sans">Coral</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs font-mono text-text-secondary">
                  <p>HEX: <span className="text-[#ff8a82]">#FE473C</span></p>
                  <p>Hover: #e53d33</p>
                  <p>Light: #ff8a82 (WCAG)</p>
                </div>
              </div>

              {/* Inteligência */}
              <div className="p-4 rounded-xl bg-card border-2 border-[#72284B]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#72284B]" />
                  <div>
                    <p className="font-sans font-bold text-foreground">Inteligência</p>
                    <p className="text-xs text-text-muted font-sans">Bordô</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs font-mono text-text-secondary">
                  <p>HEX: <span className="text-[#d4789b]">#72284B</span></p>
                  <p>Hover: #5a1f3c</p>
                  <p>Light: #d4789b (WCAG)</p>
                </div>
                <div className="mt-2 px-2 py-1 bg-[#72284B]/20 rounded text-xs text-[#d4789b] font-sans">
                  Vertical ativa neste Design System
                </div>
              </div>

              {/* Cooperação */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#889EA3]" />
                  <div>
                    <p className="font-sans font-bold text-foreground">Cooperação</p>
                    <p className="text-xs text-text-muted font-sans">Grey Ahead</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs font-mono text-text-secondary">
                  <p>HEX: <span className="text-[#b3c4c8]">#889EA3</span></p>
                  <p>Hover: #718a8f</p>
                  <p>Light: #b3c4c8 (WCAG)</p>
                </div>
              </div>

              {/* Infraestrutura */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#287266]" />
                  <div>
                    <p className="font-sans font-bold text-foreground">Infraestrutura</p>
                    <p className="text-xs text-text-muted font-sans">Petroleum Blue</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs font-mono text-text-secondary">
                  <p>HEX: <span className="text-[#4da89a]">#287266</span></p>
                  <p>Hover: #1f5a50</p>
                  <p>Light: #4da89a (WCAG)</p>
                </div>
              </div>

              {/* Administração */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#333540]" />
                  <div>
                    <p className="font-sans font-bold text-foreground">Administração</p>
                    <p className="text-xs text-text-muted font-sans">Deep Gray Blue</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs font-mono text-text-secondary">
                  <p>HEX: <span className="text-[#6b6e7a]">#333540</span></p>
                  <p>Hover: #252730</p>
                  <p>Light: #6b6e7a (WCAG)</p>
                </div>
              </div>
            </div>

            {/* Nota de uso */}
            <div className="p-4 bg-[#2a1a2a] border border-[#72284b] rounded-lg">
              <p className="text-sm text-[#d4789b] font-sans">
                <strong>Uso da cor da vertical:</strong> A cor primária da vertical ativa é usada em ícones de headers (modais/cards), underlines de tabs, botões de ação positiva, badges de destaque e elementos de foco.
              </p>
            </div>
          </div>
        </Section>

        {/* ============================================
            CORES BASE
            ============================================ */}
        <Section title="CORES BASE">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              nas imediações da empresa de RAZÃO SOCIAL: <span className="text-[#4dd4e8] bg-[#00bcd4]/20 px-1 rounded">JB Aversa Participa��ões Ltda</span>.
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
          {/* Regra de espaçamento */}
          <div className="mb-6 p-4 bg-[#2a1a2a] border border-[#72284b] rounded-lg">
            <p className="text-sm text-[#d4789b] font-sans">
              <strong>Regra de Espaçamento:</strong> A distância mínima entre botões deve ser de <strong>16px</strong> (gap-4 em Tailwind).
            </p>
          </div>
          
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

          {/* Regras visuais do botão */}
          <div className="mt-6 p-4 bg-card rounded-lg border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Anatomia do Botão (REGRAS)</h4>
            <ul className="text-sm text-text-secondary font-sans list-disc ml-4 space-y-1">
              <li><strong>Texto:</strong> Capitalização normal (ex: "Cancelar", "Remover Vinculação") - NÃO UPPERCASE</li>
              <li><strong>Border-radius:</strong> 6px (rounded-[6px])</li>
              <li><strong>Layout:</strong> justify-between (ícone ESQUERDA, texto alinhado à DIREITA)</li>
              <li><strong>Largura:</strong> 130px fixa (modal) | 110px fixa (card)</li>
              <li><strong>Padding:</strong> px-4 py-2 (default/modal) | px-3 py-1.5 (sm)</li>
              <li><strong>Gap entre botões:</strong> 16px (gap-4)</li>
              <li><strong>Fonte:</strong> font-sans + font-bold (NUNCA Cygnito)</li>
            </ul>
          </div>
          
          {/* Tamanhos disponíveis */}
          <div className="mt-4 p-4 bg-card rounded-lg border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Tamanhos (size=)</h4>
            <ul className="text-sm text-text-secondary font-sans list-disc ml-4 space-y-1">
              <li><strong>modal:</strong> w-[130px] fixa - para modais com botões uniformes</li>
              <li><strong>card:</strong> w-[110px] fixa - para cards com botões uniformes</li>
              <li><strong>default:</strong> min-w-[130px] - cresce com conteúdo longo</li>
              <li><strong>sm:</strong> min-w-[110px] - para headers, ações secundárias</li>
              <li><strong>lg:</strong> sem largura fixa - para CTAs grandes</li>
              <li><strong>icon:</strong> 40x40px quadrado - apenas ícone</li>
            </ul>
          </div>

          {/* Exemplos de botões - usando SnapButton */}
          <div className="mt-6">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Botões em Contexto de Modal</p>
            <SnapButtonGroup align="left">
              <SnapButton variant="secondary" size="modal" icon={<X className="w-4 h-4" />}>
                Cancelar
              </SnapButton>
              <SnapButton variant="primary" size="modal" icon={<RefreshCw className="w-4 h-4" />}>
                Tramitar
              </SnapButton>
            </SnapButtonGroup>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Variantes por Contexto</p>
            <div className="flex flex-wrap gap-4">
              <SnapButton variant="secondary" size="default" icon={<X className="w-4 h-4" />}>
                Cancelar
              </SnapButton>
              <SnapButton variant="secondary" size="default" icon={<X className="w-4 h-4" />}>
                Ignorar
              </SnapButton>
              <SnapButton variant="success" size="default" icon={<Check className="w-4 h-4" />}>
                Vincular
              </SnapButton>
              <SnapButton variant="success" size="default" icon={<Check className="w-4 h-4" />}>
                Criar
              </SnapButton>
              <SnapButton variant="primary" size="default" icon={<X className="w-4 h-4" />}>
                Remover Vinculação
              </SnapButton>
              <SnapButton variant="primary" size="default" icon={<RefreshCw className="w-4 h-4" />}>
                Tramitar
              </SnapButton>
            </div>
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
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ff9800]">Risco Alto</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ffc563]">Risco Médio</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">Risco Baixo</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Tags de Categoria</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#72284b]">preso</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#00bcd4]">visitante</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">advogado</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ffc563]">familiar</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ff9800]">ex-preso</span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Badges de Status</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">NOVO</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-black bg-[#ffc563]">PRIORIDADE ALTA</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#72284b]">RASCUNHO</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#676c70]">INTERNO</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">FORMALIZADO</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#fe473c]">URGENTE</span>
              <span className="px-3 py-1 rounded-full text-xs font-sans text-white bg-[#3f9f76]">SIGILOSO</span>
            </div>
          </div>

          {/* Ícones de Ação em Tabela */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Ícones de Ação (Tabela)</p>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-[6px] hover:bg-muted transition-colors">
                <Eye className="w-5 h-5 text-text-muted" />
              </button>
              <button className="p-2 rounded-[6px] hover:bg-muted transition-colors">
                <Download className="w-5 h-5 text-text-muted" />
              </button>
              <button className="p-2 rounded-[6px] hover:bg-muted transition-colors">
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
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-subtle font-sans focus:outline-none focus:ring-2 focus:ring-[#72284b]"
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
                <li><strong>Margem botões:</strong> Mínimo de <strong>36px</strong> entre o conteúdo acima e os bot����es de ação</li>
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
                
                {/* Tabela de cores e texto */}
                <div className="mt-4 pt-4 border-t border-[#3f9f76]/30">
                  <p className="text-xs text-[#3f9f76] font-bold mb-2 font-sans">Guia de cores para badges:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary font-sans">
                    <div><span className="text-white">Texto BRANCO</span>: #fe473c, #72284b, #3f9f76</div>
                    <div><span className="text-black bg-white/20 px-1 rounded">Texto PRETO</span>: #ff9800, #ffc563, #00bcd4</div>
                  </div>
                </div>
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
{/* Modal: usa CSS variables para adaptar ao tema */}
              <div className="bg-card rounded-xl border border-border max-w-md mx-auto overflow-hidden">
                {/* Header compacto */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      <span className="font-title text-[18px] text-foreground">VERIFICACAO DE ENTIDADE</span>
                    </div>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* Linha separadora do header - mesma cor da borda */}
                <div className="h-[1px] bg-border" />

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
                  <div className="bg-background rounded-lg border border-border overflow-hidden mb-4">
                    <div className="text-sm font-sans divide-y divide-border">
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
                  <div className="flex items-center justify-end gap-4">
                    <SnapButton variant="secondary" size="modal" icon={<X className="w-4 h-4" />}>
                      Cancelar
                    </SnapButton>
                    <SnapButton variant="primary" size="modal" icon={<Check className="w-4 h-4" />}>
                      Confirmar
                    </SnapButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemplo de Modal - Difusão */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-muted font-sans uppercase tracking-wide">Exemplo: Modal Difusão de Processo</p>
              {/* Modal: background #101112, borda #2A2B35, 1px */}
              <div className="bg-card rounded-xl border border-border max-w-md mx-auto overflow-hidden">
                {/* Header compacto */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Ícone sempre na cor da vertical (#72284b) */}
                      <svg className="w-5 h-5 text-[#72284b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="font-title text-[18px]">DIFUSAO DE PROCESSO</span>
                    </div>
                    <button className="p-1 rounded hover:bg-border transition-colors">
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* Linha separadora do header - mesma cor da borda */}
                <div className="h-[1px] bg-border" />

                {/* Conteúdo */}
                <div className="p-6">
                  {/* Tabs Interativas com animação */}
                  <div className="mb-4">
                    <DifusaoTabsComponent />
                  </div>

                  {/* Alert box - com borda verde */}
                  <div className="bg-border rounded-[6px] border border-success p-4 mb-4">
                    <p className="text-sm text-text-secondary font-sans">
                      SUBSEC e SUP-CONTRA-INTEL são obrigatórios e não podem ser desmarcados.
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="bg-background border border-border rounded-lg px-4 py-3 flex items-center gap-2 mb-4">
                    <span className="text-text-muted text-sm font-sans">Buscar pessoa</span>
                    <Search className="w-4 h-4 text-text-muted ml-auto" />
                  </div>

                  {/* Lista expansível (Accordion) - Interativo */}
                  <div className="mb-9">
                    <DifusaoAccordion />
                  </div>

                  {/* Botões - SEMPRE à direita, radius 6px, ícone esquerda + texto direita */}
                  <div className="flex items-center justify-end gap-4">
                    <button className="w-[130px] flex items-center justify-between px-4 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-sm font-bold font-sans hover:bg-border transition-colors">
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
                <li><strong>Background:</strong> #0f0f10</li>
                <li><strong>Borda:</strong> #2a2b35, 1px</li>
                <li><strong>Border-radius:</strong> 12px</li>
                <li><strong>Largura:</strong> ~340px (compacto)</li>
                <li><strong>Header:</strong> padding-top <strong>16px</strong> (pt-4), padding-bottom <strong>12px</strong> (pb-3)</li>
                <li><strong>Header:</strong> Ícone 20px (cor da vertical) + Título (<strong>Inter/Sans</strong>, 18px, font-medium, capitalize)</li>
                <li><strong>Linha separadora:</strong> #2a2b35, 1px, com <strong>margem horizontal de 20px</strong> (mx-5)</li>
                <li><strong>Área de destaque:</strong> Background #222222, border-radius 8px, padding px-3 py-2, texto 12px itálico</li>
                <li><strong>Lista de campos:</strong> Label (bold, 12px, w-20) + Valor (regular, 12px), espaçamento vertical 4px (space-y-1)</li>
                <li><strong>Botões:</strong> Alinhados à <strong>ESQUERDA</strong>, largura 110px, texto 12px, gap-2</li>
                <li><strong>Margem botões:</strong> <strong>24px</strong> (mb-6) entre o conteúdo e os botões</li>
              </ul>
              
              {/* Regra importante sobre tipografia */}
              <div className="mt-4 p-3 bg-[#2a1a2a] border border-[#72284b] rounded-lg">
                <p className="text-sm text-[#d4789b] font-sans">
                  <strong>Regra de Tipografia:</strong> Apesar da Cygnito ser usada para títulos, em <strong>Cards</strong> usa-se <strong>Inter (font-sans)</strong> mesmo para títulos de 18px ou menores.
                </p>
              </div>
              
              {/* Diferenças entre Card e Modal */}
              <div className="mt-4 p-4 bg-[#1a2b3f] border border-[#3f7fbf] rounded-lg">
                <h4 className="text-sm font-bold text-[#3f7fbf] mb-2 font-sans">Diferenças: Card vs Modal</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary font-sans">
                  <div>
                    <p className="text-foreground font-medium mb-1">Card</p>
                    <ul className="space-y-1 list-disc ml-4">
                      <li>Botões à ESQUERDA</li>
                      <li>Margem botões: 24px</li>
                      <li>Linha separadora: mx-5</li>
                      <li>Título: <strong>Inter</strong> 18px capitalize</li>
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
                      <li>Título: <strong>Cygnito</strong> 18px UPPERCASE</li>
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
                {/* Header - pt-4 (16px) do topo, pb-3 (12px) até a linha */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#72284b]" />
                    <span className="font-sans text-[18px] font-medium text-foreground">Endereço</span>
                  </div>
                </div>
                
                {/* Linha separadora com margem horizontal de 20px */}
                <div className="mx-5 h-[1px] bg-border" />

                {/* Conteúdo */}
                <div className="p-5">
                  {/* Área de destaque */}
                  <div className="bg-muted rounded-lg px-3 py-2 mb-4">
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
                  <div className="flex items-center justify-start gap-4">
                    <button className="w-[110px] flex items-center justify-between px-3 py-2 rounded-[6px] bg-transparent border border-[#676c70] text-foreground text-xs font-bold font-sans hover:bg-border transition-colors">
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
                <div className="bg-toast-success rounded-[8px] border-2 border-toast-success-border px-5 py-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-toast-success-icon" />
                  </div>
                  <span className="text-toast text-base font-sans">Processo criado com sucesso.</span>
                </div>

                {/* Toast Sucesso - Compacto */}
                <div className="bg-toast-success rounded-[6px] border-2 border-toast-success-border px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-toast-success-icon" />
                  </div>
                  <span className="text-toast text-sm font-sans">Processo criado com sucesso.</span>
                </div>

                {/* Toast Erro - Regular */}
                <div className="bg-toast-error rounded-[8px] border-2 border-toast-error-border px-5 py-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-toast-error-icon" />
                  </div>
                  <span className="text-toast text-base font-sans">Erro ao criar processo. Tente novamente.</span>
                </div>

                {/* Toast Warning - Regular */}
                <div className="bg-toast-warning rounded-[8px] border-2 border-toast-warning-border px-5 py-4 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-toast-warning-icon" />
                  </div>
                  <span className="text-toast text-base font-sans">Atenção: campos obrigatórios não preenchidos.</span>
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
                <li><strong>Ícones de aç��o:</strong> Visualizar/Download = cinza | Excluir = rosa #72284b</li>
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

        {/* ============================================
            APLICATIVOS DERIVADOS
            ============================================ */}
        <Section title="APLICATIVOS DERIVADOS">
          <p className="text-text-secondary mb-6 font-sans">
            Documentação específica para aplicativos do Ecossistema SNAP. Cada aplicativo possui sua página dedicada com 
            especificações detalhadas de interface.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card SNAP Graph */}
            <a 
              href="/design-system/snap-graph" 
              className="group p-6 rounded-xl bg-[#696969]/10 border border-[#696969] hover:bg-[#696969]/20 transition-colors"
            >
              <div className="flex items-center gap-4 mb-3">
                <img src="/assets/snap-graph-logo.svg" alt="SNAP Graph" className="h-8" />
                <div>
                  <p className="text-sm font-bold text-[#8a8a8a] font-sans group-hover:text-white transition-colors">SNAP Graph</p>
                  <p className="text-xs text-text-muted font-sans">Área Agnóstica • Visualização de Grafos</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary font-sans">
                Aplicativo de busca e visualização de entidades em grafo. Por ser usado por todas as verticais, 
                utiliza uma cor neutra para não criar conflito visual.
              </p>
              <div className="mt-3 text-xs text-[#696969] font-sans">
                Clique para ver documentação completa →
              </div>
            </a>

            {/* Placeholder para futuros apps */}
            <div className="p-6 rounded-xl bg-card border border-border border-dashed opacity-50">
              <p className="text-sm font-bold text-text-muted font-sans">Outros Aplicativos</p>
              <p className="text-xs text-text-muted font-sans mt-1">Em breve...</p>
            </div>
          </div>
        </Section>

        {/* ============================================
            COMPONENTES SNAP (PORTÁVEIS)
            ============================================ */}
        <Section title="COMPONENTES SNAP">
          <div className="space-y-6">
            {/* Instruções de Portabilidade */}
            <div className="p-4 rounded-xl bg-[#1a2b1f] border border-[#3f9f76]">
              <h4 className="text-sm font-bold text-[#3f9f76] mb-2 font-sans">Portabilidade para Kiro/Outros Projetos</h4>
              <p className="text-sm text-text-secondary font-sans mb-3">
                Os componentes SNAP estão isolados e prontos para serem copiados para qualquer projeto:
              </p>
              <ol className="text-sm text-text-secondary font-sans list-decimal ml-4 space-y-1">
                <li>Copie a pasta <code className="text-[#3f9f76] bg-[#3f9f76]/10 px-1 rounded">/components/snap/</code></li>
                <li>Copie o arquivo <code className="text-[#3f9f76] bg-[#3f9f76]/10 px-1 rounded">/lib/snap-tokens.ts</code></li>
                <li>Instale as dependências: <code className="text-[#3f9f76] bg-[#3f9f76]/10 px-1 rounded">class-variance-authority</code>, <code className="text-[#3f9f76] bg-[#3f9f76]/10 px-1 rounded">lucide-react</code></li>
                <li>Configure as fontes Cygnito Mono e Inter Tight</li>
              </ol>
            </div>

            {/* Lista de Componentes */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Componentes Disponíveis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapBadge</code>
                    <span className="text-text-secondary">Badges de risco, status e categoria</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapButton</code>
                    <span className="text-text-secondary">Botões com variantes e layout interno</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapCard</code>
                    <span className="text-text-secondary">Card de entidade com subcomponentes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapModal</code>
                    <span className="text-text-secondary">Modal com header, content e footer</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapTabs</code>
                    <span className="text-text-secondary">Tabs com underline animado</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapSelect</code>
                    <span className="text-text-secondary">Select estilo accordion</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">SnapEntityLink</code>
                    <span className="text-text-secondary">Links de entidade com cores WCAG</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">verticals</code>
                    <span className="text-text-secondary">Cores das 5 verticais SNAP</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-[#72284b] bg-[#72284b]/10 px-1 rounded text-xs">snapTokens</code>
                    <span className="text-text-secondary">Tokens centralizados (cores, espaçamentos)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estrutura de Arquivos */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Estrutura de Arquivos</h4>
              <pre className="text-xs text-text-secondary font-mono bg-card p-4 rounded-lg overflow-x-auto">
{`/components/snap/
  ├── index.ts              # Exports centralizados (inclui verticais)
  ├── snap-badge.tsx        # SnapBadge, RiskBadge, StatusBadge, CategoryTag
  ├── snap-button.tsx       # SnapButton, SnapButtonGroup
  ├── snap-card.tsx         # SnapCard, SnapCardHeader, SnapCardTitle, etc.
  ├── snap-modal.tsx        # SnapModal, SnapModalHeader, SnapModalContent, etc.
  ├── snap-tabs.tsx         # SnapTabs, SnapTabsList, SnapTabsTrigger, SnapTabsContent
  ├── snap-select.tsx       # SnapSelect (estilo accordion)
  └── snap-entity-link.tsx  # SnapEntityLink, PessoaLink, EnderecoLink, etc.

/lib/
  └── snap-tokens.ts        # Verticais, cores, tipografia, espaçamentos, WCAG
                            # Cores das verticais:
                            # - Investigação: Coral (#FE473C)
                            # - Inteligência: Bordô (#72284B) <- ativa
                            # - Cooperação: Grey Ahead (#889EA3)
                            # - Infraestrutura: Petroleum Blue (#287266)
                            # - Administração: Deep Gray Blue (#333540)`}
              </pre>
            </div>

            {/* Exemplo de Uso */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 font-sans">Exemplo de Uso</h4>
              <pre className="text-xs text-text-secondary font-mono bg-card p-4 rounded-lg overflow-x-auto">
{`import { 
  SnapCard, 
  SnapCardHeader, 
  SnapCardTitle, 
  SnapCardSeparator,
  SnapCardContent,
  SnapCardFooter,
  SnapButton,
  RiskBadge,
} from "@/components/snap"
import { MapPin, X, Check } from "lucide-react"

export function EnderecoCard() {
  return (
    <SnapCard>
      <SnapCardHeader>
        <SnapCardTitle icon={<MapPin className="w-5 h-5" />}>
          Endereço
        </SnapCardTitle>
      </SnapCardHeader>
      <SnapCardSeparator />
      <SnapCardContent>
        {/* ... conteúdo ... */}
        <SnapCardFooter>
          <SnapButton variant="secondary" size="card" icon={<X className="w-3.5 h-3.5" />}>
            Ignorar
          </SnapButton>
          <SnapButton variant="primary" size="card" icon={<Check className="w-3.5 h-3.5" />}>
            Vincular
          </SnapButton>
        </SnapCardFooter>
      </SnapCardContent>
    </SnapCard>
  )
}`}
              </pre>
            </div>
          </div>
        </Section>

      </main>
    </div>
  )
}
