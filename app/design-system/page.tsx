"use client"

import { useState } from "react"
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
              Nesta data, foi verificada a presença da pessoa de NOME: <span className="text-[#72284b]">João Bernardo Guimarães Aversa</span>, 
              CPF: <span className="text-[#72284b]">013.511.976-65</span> na localidade de Belo Horizonte, 
              localizado no ENDEREÇO: <span className="text-[#d4a017]">Rua Major Lopes, NÚMERO: 37, BAIRRO: Barro Preto</span>. 
              O alvo foi visto em um VEÍCULO: <span className="text-[#00bcd4]">Corsa Sedan, PLACA: NPX-3031</span>, 
              nas imediações da empresa de RAZÃO SOCIAL: <span className="text-[#00bcd4]">JB Aversa Participações Ltda</span>.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#72284b]" />
              <span className="text-sm text-text-secondary font-sans">Pessoa = Rosa #72284b</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#d4a017]" />
              <span className="text-sm text-text-secondary font-sans">Endereço = Amarelo #d4a017</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-[#00bcd4]" />
              <span className="text-sm text-text-secondary font-sans">Veículo = Ciano #00bcd4</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#00bcd4]" />
              <span className="text-sm text-text-secondary font-sans">Empresa = Ciano #00bcd4</span>
            </div>
          </div>
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

          {/* Tabs Underline */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Tabs (Underline)</p>
            <div className="flex gap-6 border-b border-border">
              <button className="pb-3 border-b-2 border-[#72284b] text-foreground font-sans flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documentos
              </button>
              <button className="pb-3 border-b-2 border-transparent text-text-muted font-sans flex items-center gap-2">
                Tramitações
              </button>
              <button className="pb-3 border-b-2 border-transparent text-text-muted font-sans flex items-center gap-2">
                Auditoria
              </button>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="mb-8">
            <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">Toggle Buttons</p>
            <div className="inline-flex rounded-full overflow-hidden border border-border">
              <button className="px-4 py-2 bg-[#72284b] text-white font-sans text-sm">Ativas</button>
              <button className="px-4 py-2 bg-transparent text-text-muted font-sans text-sm">Encerradas</button>
            </div>
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
