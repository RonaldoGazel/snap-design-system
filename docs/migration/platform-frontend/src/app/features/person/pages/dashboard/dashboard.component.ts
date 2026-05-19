import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PersonDataService } from '../../services/person-data.service';

import { TipoPerfil, TipoFonte } from '../../models';
import { derivePerfilFromRotulos } from '../../services/api-person-mapper';

// --- Interfaces locais ---

interface ContadorResumo {
  rotulo: string;
  valor: number;
  icone: string;
}

interface AlertaCard {
  data: string;
  texto: string;
}

interface MonitoradoCard {
  id: string;
  nome: string;
  vulgo?: string;
  fotoUrl?: string;
  perfilPrincipal: TipoPerfil;
  indicadorPerfil?: string;
  faccao?: string;
  nivelRisco: 'critico' | 'alto' | 'medio' | 'baixo';
  tags: { rotulo: string; cor?: string; categoria?: string }[];
  alertas: AlertaCard[];
  sourceDisplayName?: string;
  mergedFrom?: number;
}

interface TabBusca {
  id: string;
  termo: string;
  carregando: boolean;
  resultados: MonitoradoCard[];
  total: number;
}

interface TabListagem {
  id: string;
  perfil: string;
  label: string;
  total: number;
  carregando: boolean;
  cards: MonitoradoCard[];
}

interface AlertaRecente {
  id: string;
  pessoaId: string;
  nomePessoa: string;
  fotoUrl?: string;
  tipo: string;
  fonte: TipoFonte;
  dataGeracao: string;
}

type CategoriaPendencia = 'novos-registros' | 'integracao' | 'deduplicacao' | 'revisao';

interface Pendencia {
  id: string;
  categoria: CategoriaPendencia;
  data: string;
  pessoa: { id: string; nome: string; fotoUrl?: string };
  pessoaDuplicada?: { id: string; nome: string; fotoUrl?: string };
}

interface PerfilDistribuicao {
  perfil: TipoPerfil;
  rotulo: string;
  icone: string;
  total: number;
  percentual: number;
}

// --- Dados hardcoded: Distribuição da base ---

const TOTAL_BASE = 51438;

const DISTRIBUICAO_PERFIS: PerfilDistribuicao[] = [
  { perfil: 'preso', rotulo: 'Presos', icone: 'pi-lock', total: 18502, percentual: 0 },
  { perfil: 'ex-preso', rotulo: 'Ex-presos', icone: 'pi-unlock', total: 12359, percentual: 0 },
  { perfil: 'visitante', rotulo: 'Visitantes', icone: 'pi-user', total: 8231, percentual: 0 },
  { perfil: 'familiar', rotulo: 'Familiares', icone: 'pi-users', total: 5144, percentual: 0 },
  { perfil: 'advogado', rotulo: 'Advogados', icone: 'pi-briefcase', total: 3087, percentual: 0 },
  { perfil: 'alvo', rotulo: 'Alvos', icone: 'pi-bullseye', total: 2572, percentual: 0 },
  { perfil: 'servidor', rotulo: 'Servidores', icone: 'pi-shield', total: 1543, percentual: 0 },
].map((p) => ({ ...p, percentual: (p.total / TOTAL_BASE) * 100 })) as PerfilDistribuicao[];

// --- MONITORADOS_EXTRAS commented out — kept for reference (Task 7.2) ---
// Real data now comes exclusively from PersonDataService.pessoas()
/*
const MONITORADOS_EXTRAS: MonitoradoCard[] = [
  {
    id: UNIFIED_PERSON_MOCK.id,
    nome: UNIFIED_PERSON_MOCK.name,
    vulgo: UNIFIED_PERSON_MOCK.aliases[0],
    fotoUrl: UNIFIED_PERSON_MOCK.photoUrl,
    perfilPrincipal: resolvePrimaryProfile(UNIFIED_PERSON_MOCK.profiles) ?? 'preso',
    faccao: UNIFIED_PERSON_MOCK.custody?.faction,
    nivelRisco: UNIFIED_PERSON_MOCK.riskLevel,
    tags: UNIFIED_PERSON_MOCK.tags
      .slice(0, 3)
      .map((t) => ({ rotulo: t.label, cor: t.color, categoria: t.category })),
    alertas: [{ data: '2025-01-15T10:00:00', texto: 'Transferência em negociação — PEIS' }],
  },
  {
    id: SNAP_ONLY_PERSON_MOCK.id,
    nome: SNAP_ONLY_PERSON_MOCK.name,
    perfilPrincipal: resolvePrimaryProfile(SNAP_ONLY_PERSON_MOCK.profiles) ?? 'alvo',
    nivelRisco: SNAP_ONLY_PERSON_MOCK.riskLevel,
    tags: SNAP_ONLY_PERSON_MOCK.tags
      .slice(0, 3)
      .map((t) => ({ rotulo: t.label, cor: t.color, categoria: t.category })),
    alertas: [{ data: '2025-01-12T08:30:00', texto: 'Mandado de prisão ativo (BNMP)' }],
  },
  {
    id: SIPEN_ONLY_PERSON_MOCK.id,
    nome: SIPEN_ONLY_PERSON_MOCK.name,
    vulgo: SIPEN_ONLY_PERSON_MOCK.aliases[0],
    fotoUrl: SIPEN_ONLY_PERSON_MOCK.photoUrl,
    perfilPrincipal: resolvePrimaryProfile(SIPEN_ONLY_PERSON_MOCK.profiles) ?? 'preso',
    faccao: SIPEN_ONLY_PERSON_MOCK.custody?.faction,
    nivelRisco: SIPEN_ONLY_PERSON_MOCK.riskLevel,
    tags: SIPEN_ONLY_PERSON_MOCK.tags
      .slice(0, 3)
      .map((t) => ({ rotulo: t.label, cor: t.color, categoria: t.category })),
    alertas: [{ data: '2025-01-14T16:00:00', texto: 'Transferência em negociação — PEIS' }],
  },
  // 4 presos
  {
    id: 'me-1',
    nome: 'Fábio Henrique Rocha',
    vulgo: 'Fabinho',
    fotoUrl: '/images/photos/pessoa-02.png',
    perfilPrincipal: 'preso',
    faccao: 'CV',
    nivelRisco: 'critico',
    tags: [
      { rotulo: 'CV', cor: '#DC2626', categoria: 'classificacao-criminal' },
      { rotulo: 'Liderança', cor: '#B91C1C', categoria: 'classificacao-criminal' },
    ],
    alertas: [
      { data: '2025-01-08T16:45:00', texto: 'Transferência para unidade de segurança máxima' },
      { data: '2025-01-05T09:20:00', texto: 'Incidente disciplinar registrado na cela' },
      { data: '2025-01-02T14:10:00', texto: 'Visita de advogado com atuação em múltiplos presos' },
    ],
  },
  {
    id: 'me-2',
    nome: 'Leandro Souza Pinto',
    vulgo: 'Lê',
    fotoUrl: '/images/photos/pessoa-03.png',
    perfilPrincipal: 'preso',
    nivelRisco: 'alto',
    tags: [{ rotulo: 'Informante', categoria: 'monitoramento' }],
    alertas: [
      { data: '2025-01-05T11:30:00', texto: 'Relatório de comportamento negativo' },
      { data: '2025-01-01T08:15:00', texto: 'Mudança de cela por segurança' },
    ],
  },
  {
    id: 'me-3',
    nome: 'Thiago Batista Lima',
    fotoUrl: '/images/photos/pessoa-04.png',
    perfilPrincipal: 'preso',
    faccao: 'TCP',
    nivelRisco: 'medio',
    tags: [{ rotulo: 'TCP', cor: '#DC2626', categoria: 'classificacao-criminal' }],
    alertas: [{ data: '2025-01-03T10:00:00', texto: 'Mudança de regime para semiaberto' }],
  },
  {
    id: 'me-4',
    nome: 'Adriana Pereira dos Santos',
    fotoUrl: '/images/photos/pessoa-10.png',
    perfilPrincipal: 'preso',
    nivelRisco: 'baixo',
    tags: [{ rotulo: 'Em revisão', categoria: 'status-operacional' }],
    alertas: [],
  },
  // 3 ex-presos
  {
    id: 'me-5',
    nome: 'Rafaela Oliveira Gomes',
    vulgo: 'Rafa',
    fotoUrl: '/images/photos/pessoa-06.png',
    perfilPrincipal: 'ex-preso',
    nivelRisco: 'alto',
    tags: [
      { rotulo: 'Liberdade', categoria: 'sinal-analitico' },
      { rotulo: 'Vínculo recorrente', categoria: 'sinal-analitico' },
    ],
    alertas: [
      { data: '2025-01-09T17:40:00', texto: 'Contato com preso monitorado detectado' },
      { data: '2025-01-06T13:25:00', texto: 'Presença em área próxima a unidade prisional' },
    ],
  },
  {
    id: 'me-6',
    nome: 'Cláudio Ferreira Nunes',
    fotoUrl: '/images/photos/pessoa-07.png',
    perfilPrincipal: 'ex-preso',
    nivelRisco: 'medio',
    tags: [
      { rotulo: 'Condicional', categoria: 'sinal-analitico' },
      { rotulo: 'Tornozeleira', categoria: 'monitoramento' },
    ],
    alertas: [],
  },
  {
    id: 'me-7',
    nome: 'Diego Martins Araújo',
    vulgo: 'Diegão',
    fotoUrl: '/images/photos/pessoa-11.png',
    perfilPrincipal: 'ex-preso',
    nivelRisco: 'critico',
    faccao: 'PCC',
    tags: [
      { rotulo: 'PCC', cor: '#DC2626', categoria: 'classificacao-criminal' },
      { rotulo: 'Foragido', categoria: 'sinal-analitico' },
    ],
    alertas: [
      { data: '2025-01-11T08:00:00', texto: 'Mandado de recaptura emitido' },
      { data: '2025-01-09T22:15:00', texto: 'Avistamento reportado na Baixada Fluminense' },
      { data: '2025-01-07T15:30:00', texto: 'Tornozeleira eletrônica violada' },
    ],
  },
  // 3 visitantes
  {
    id: 'me-8',
    nome: 'Marcos Lima da Costa',
    fotoUrl: '/images/photos/pessoa-08.png',
    perfilPrincipal: 'visitante',
    nivelRisco: 'medio',
    tags: [{ rotulo: 'Visita sensível', categoria: 'sinal-analitico' }],
    alertas: [
      { data: '2025-01-07T14:20:00', texto: 'Visita a 2 internos monitorados no mesmo dia' },
    ],
  },
  {
    id: 'me-9',
    nome: 'Jéssica Almeida Ramos',
    fotoUrl: '/images/photos/pessoa-12.png',
    perfilPrincipal: 'visitante',
    nivelRisco: 'baixo',
    tags: [{ rotulo: 'Testemunha', categoria: 'sinal-analitico' }],
    alertas: [],
  },
  {
    id: 'me-10',
    nome: 'Carlos Barbosa Teixeira',
    fotoUrl: '/images/photos/pessoa-09.png',
    perfilPrincipal: 'visitante',
    nivelRisco: 'alto',
    tags: [
      { rotulo: 'Visita sensível', categoria: 'sinal-analitico' },
      { rotulo: 'Vínculo recorrente', categoria: 'sinal-analitico' },
    ],
    alertas: [
      { data: '2025-01-12T09:45:00', texto: 'Frequência de visitas acima do padrão' },
      { data: '2025-01-08T16:00:00', texto: 'Visita simultânea a internos de facções rivais' },
      { data: '2025-01-04T11:30:00', texto: 'Objeto suspeito detectado na revista' },
    ],
  },
  // 2 advogados
  {
    id: 'me-11',
    nome: 'Dra. Fernanda Vieira',
    perfilPrincipal: 'advogado',
    nivelRisco: 'medio',
    tags: [{ rotulo: 'Vínculo recorrente', categoria: 'sinal-analitico' }],
    alertas: [{ data: '2025-01-08T10:30:00', texto: 'Atendimento a 3 presos da mesma facção' }],
  },
  {
    id: 'me-12',
    nome: 'Dr. Marcelo Duarte',
    perfilPrincipal: 'advogado',
    nivelRisco: 'baixo',
    tags: [
      { rotulo: 'CV', cor: '#DC2626', categoria: 'classificacao-criminal' },
      { rotulo: 'Monitorado', categoria: 'monitoramento' },
    ],
    alertas: [],
  },
  // 2 pessoa-relacionada/alvo
  {
    id: 'me-13',
    nome: 'Renato Figueiredo',
    vulgo: 'Renatinho',
    fotoUrl: '/images/photos/pessoa-13.png',
    perfilPrincipal: 'alvo',
    faccao: 'CV',
    nivelRisco: 'critico',
    tags: [
      { rotulo: 'CV', cor: '#DC2626', categoria: 'classificacao-criminal' },
      { rotulo: 'Alvo prioritário', categoria: 'monitoramento' },
    ],
    alertas: [
      { data: '2025-01-12T20:10:00', texto: 'Novo vínculo com líder faccional identificado' },
      { data: '2025-01-10T07:45:00', texto: 'Menção em interceptação telefônica' },
    ],
  },
  {
    id: 'me-14',
    nome: 'Vanessa Cristina Moura',
    perfilPrincipal: 'familiar',
    nivelRisco: 'medio',
    tags: [{ rotulo: 'Vínculo recorrente', categoria: 'sinal-analitico' }],
    alertas: [{ data: '2025-01-09T12:00:00', texto: 'Referência cruzada em documento SNAP' }],
  },
];
*/

// --- Dados hardcoded: Pendências ---

const MOCK_PENDENCIAS: Pendencia[] = [
  // 3 novos-registros
  {
    id: 'pend-1',
    categoria: 'novos-registros',
    data: '2025-01-12',
    pessoa: {
      id: 'p-nr1',
      nome: 'Gustavo Henrique Lopes',
      fotoUrl: '/images/photos/pessoa-05.png',
    },
  },
  {
    id: 'pend-2',
    categoria: 'novos-registros',
    data: '2025-01-11',
    pessoa: {
      id: 'p-nr2',
      nome: 'Eliane Cristina Borges',
      fotoUrl: '/images/photos/pessoa-06.png',
    },
  },
  {
    id: 'pend-3',
    categoria: 'novos-registros',
    data: '2025-01-10',
    pessoa: {
      id: 'p-nr3',
      nome: 'Sérgio Luís Tavares',
      fotoUrl: '/images/photos/pessoa-01.png',
    },
  },
  // 2 integracao
  {
    id: 'pend-4',
    categoria: 'integracao',
    data: '2025-01-09',
    pessoa: {
      id: 'p8',
      nome: 'Roberto Carlos Nascimento',
      fotoUrl: '/images/photos/pessoa-08.png',
    },
  },
  {
    id: 'pend-5',
    categoria: 'integracao',
    data: '2025-01-08',
    pessoa: {
      id: 'p-int2',
      nome: 'Adriana Souza Melo',
      fotoUrl: '/images/photos/pessoa-10.png',
    },
  },
  // 3 deduplicacao (com pessoaDuplicada)
  {
    id: 'pend-6',
    categoria: 'deduplicacao',
    data: '2025-01-07',
    pessoa: {
      id: 'p-dd1',
      nome: 'José Carlos Mendes',
      fotoUrl: '/images/photos/pessoa-03.png',
    },
    pessoaDuplicada: {
      id: 'p-dd1b',
      nome: 'José C. Mendes',
      fotoUrl: '/images/photos/pessoa-07.png',
    },
  },
  {
    id: 'pend-7',
    categoria: 'deduplicacao',
    data: '2025-01-06',
    pessoa: {
      id: 'p-dd2',
      nome: 'Maria Aparecida Silva',
      fotoUrl: '/images/photos/pessoa-12.png',
    },
    pessoaDuplicada: {
      id: 'p-dd2b',
      nome: 'Maria A. da Silva',
      fotoUrl: '/images/photos/pessoa-09.png',
    },
  },
  {
    id: 'pend-8',
    categoria: 'deduplicacao',
    data: '2025-01-05',
    pessoa: {
      id: 'p-dd3',
      nome: 'Paulo Roberto Ferreira',
      fotoUrl: '/images/photos/pessoa-04.png',
    },
    pessoaDuplicada: {
      id: 'p-dd3b',
      nome: 'Paulo R. Ferreira Neto',
      fotoUrl: '/images/photos/pessoa-11.png',
    },
  },
  // 2 revisao
  {
    id: 'pend-9',
    categoria: 'revisao',
    data: '2025-01-04',
    pessoa: { id: 'p6', nome: 'Wagner "Bigode"', fotoUrl: '/images/photos/pessoa-02.png' },
  },
  {
    id: 'pend-10',
    categoria: 'revisao',
    data: '2025-01-03',
    pessoa: {
      id: 'p-rev2',
      nome: 'Tatiana Reis Monteiro',
      fotoUrl: '/images/photos/pessoa-13.png',
    },
  },
];

// --- Helpers ---

const PERFIL_LABELS: Record<string, string> = {
  preso: 'Preso',
  'ex-preso': 'Ex-preso',
  visitante: 'Visitante',
  familiar: 'Familiar',
  advogado: 'Advogado',
  alvo: 'Alvo',
  'pessoa-relacionada': 'Pessoa relacionada',
  servidor: 'Servidor',
};

const CATEGORIA_LABELS: Record<string, string> = {
  'novos-registros': 'Novos registros',
  integracao: 'Integração',
  deduplicacao: 'Deduplicação',
  revisao: 'Revisão',
};

@Component({
  selector: 'app-person-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    FormsModule,
    TitleCasePipe,
    ButtonModule,
    SelectModule,
    TooltipModule,
    MultiSelectModule,
    TranslateModule,
  ],
})
export class DashboardComponent {
  protected readonly personData = inject(PersonDataService);
  private readonly router = inject(Router);

  // --- Signals ---
  protected readonly termoBusca = signal('');
  protected readonly paginaMonitorados = signal(0);
  protected readonly categoriaFiltro = signal<string>('todos');
  protected readonly categoriaSelecionada = signal<string | null>(null);
  protected readonly alertaIndices = signal<Record<string, number>>({});
  protected readonly buscandoAlertas = signal<Set<string>>(new Set());
  protected readonly alertaAnimacao = signal<Record<string, 'slide-up' | 'slide-down' | null>>({});
  protected readonly tabsBusca = signal<TabBusca[]>([]);
  protected readonly tabsListagem = signal<TabListagem[]>([]);
  protected readonly tabAtivaId = signal<string>('monitorados');
  protected readonly filtroRisco = signal<string[]>([]);
  protected readonly filtroPerfil = signal<string[]>([]);
  protected readonly filtroFaccao = signal<string[]>([]);
  protected readonly filtroUnidade = signal<string[]>([]);
  protected readonly filtrosAbertos = signal(false);
  protected readonly ordenacao = signal<'data' | 'az' | 'za' | null>(null);
  protected readonly paginaSimulada = signal(1);
  protected readonly carregandoPagina = signal(false);
  protected readonly totalPaginasSimuladas = 4;
  protected readonly skeletonArray = Array.from({ length: 16 });

  protected readonly opcoesRisco = [
    { label: 'Crítico', value: 'critico' },
    { label: 'Alto', value: 'alto' },
    { label: 'Médio', value: 'medio' },
    { label: 'Baixo', value: 'baixo' },
  ];

  protected readonly opcoesPerfil = [
    { label: 'Preso', value: 'preso' },
    { label: 'Ex-preso', value: 'ex-preso' },
    { label: 'Visitante', value: 'visitante' },
    { label: 'Familiar', value: 'familiar' },
    { label: 'Advogado', value: 'advogado' },
    { label: 'Alvo', value: 'alvo' },
    { label: 'Pessoa relacionada', value: 'pessoa-relacionada' },
    { label: 'Servidor', value: 'servidor' },
  ];

  protected readonly opcoesFaccao = [
    { label: 'CV', value: 'cv' },
    { label: 'PCC', value: 'pcc' },
  ];

  protected readonly opcoesUnidade = [
    { label: 'Norte', value: 'norte' },
    { label: 'Sul', value: 'sul' },
    { label: 'Bangu', value: 'bangu' },
  ];

  protected readonly buscaAtiva = computed(() => this.termoBusca().length >= 2);

  protected readonly totalFiltrosAvancados = computed(
    () => this.filtroPerfil().length + this.filtroFaccao().length + this.filtroUnidade().length,
  );

  protected readonly categoriasPessoa = [
    { label: 'Presos', value: 'preso' },
    { label: 'Ex-presos', value: 'ex-preso' },
    { label: 'Visitantes', value: 'visitante' },
    { label: 'Familiares', value: 'familiar' },
    { label: 'Advogados', value: 'advogado' },
    { label: 'Alvos', value: 'alvo' },
    { label: 'Pessoas relacionadas', value: 'pessoa-relacionada' },
    { label: 'Servidores', value: 'servidor' },
  ];

  // --- Dados estáticos ---
  protected readonly totalBase = TOTAL_BASE;
  protected readonly distribuicaoPerfis = DISTRIBUICAO_PERFIS;

  protected readonly categorias = [
    { valor: 'todos', rotulo: 'Todos' },
    { valor: 'novos-registros', rotulo: 'Novos registros' },
    { valor: 'integracao', rotulo: 'Integração' },
    { valor: 'deduplicacao', rotulo: 'Deduplicação' },
    { valor: 'revisao', rotulo: 'Revisão' },
  ];

  // --- Computed ---

  protected readonly monitorados = computed<MonitoradoCard[]>(() => {
    const pessoas = this.personData.pessoas();
    return pessoas.map((p) => {
      // Task 7.3: Derive profile from rotulos when perfis is empty
      const perfis = p.perfis?.length > 0 ? p.perfis : derivePerfilFromRotulos(p.rotulos ?? []);
      const perfilPrincipal = perfis[0]?.tipo ?? ('preso' as TipoPerfil);

      return {
        id: p.id,
        nome: p.nome,
        vulgo: (p.vulgos ?? [])[0],
        fotoUrl: p.fotoUrl ?? undefined,
        perfilPrincipal,
        faccao: (p.tagsRelevantes ?? []).find((t) => t.categoria === 'classificacao-criminal')
          ?.rotulo,
        nivelRisco: (p.indicadoresAnaliticos?.nivelRisco ??
          'baixo') as MonitoradoCard['nivelRisco'],
        tags: (p.tagsRelevantes ?? [])
          .slice(0, 3)
          .map((t) => ({ rotulo: t.rotulo, cor: t.cor, categoria: t.categoria })),
        alertas: [
          {
            data: '2025-01-10T14:32:00',
            texto: p.resumoAnalitico?.substring(0, 60) ?? 'Alerta registrado',
          },
        ],
        // Task 7.5: Provenance metadata
        sourceDisplayName: p._sources?.[0]?.display_name,
        mergedFrom: p._merged_from,
      };
    });
  });

  protected readonly monitoradosFiltrados = computed(() => {
    const todos = this.monitorados();
    const risco = this.filtroRisco();
    const perfil = this.filtroPerfil();
    const ord = this.ordenacao();

    let resultado = todos.filter(
      (m) =>
        (risco.length === 0 || risco.includes(m.nivelRisco)) &&
        (perfil.length === 0 || perfil.includes(m.perfilPrincipal)),
    );

    if (ord === 'data') {
      resultado = [...resultado].sort((a, b) => {
        const dataA = a.alertas[0]?.data ?? '';
        const dataB = b.alertas[0]?.data ?? '';
        return dataB.localeCompare(dataA);
      });
    } else if (ord === 'az') {
      resultado = [...resultado].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else if (ord === 'za') {
      resultado = [...resultado].sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
    }

    return resultado;
  });

  protected readonly monitoradosPagina = computed(() => {
    const page = this.paginaMonitorados();
    return this.monitoradosFiltrados().slice(page * 16, (page + 1) * 16);
  });

  protected readonly totalPaginas = computed(() =>
    Math.ceil(this.monitoradosFiltrados().length / 16),
  );

  protected readonly paginasArray = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i),
  );

  protected readonly alertasRecentes = computed<AlertaRecente[]>(() => {
    const alertas = this.personData.alertas();
    return [...alertas]
      .sort((a, b) => new Date(b.dataGeracao).getTime() - new Date(a.dataGeracao).getTime())
      .slice(0, 8)
      .map((a) => {
        const pessoa = this.personData.getPessoaById(a.pessoaId)();
        return {
          id: a.id,
          pessoaId: a.pessoaId,
          nomePessoa: pessoa?.nome ?? 'Pessoa desconhecida',
          fotoUrl: pessoa?.fotoUrl,
          tipo: a.tipo.replace(/-/g, ' '),
          fonte: a.fonte,
          dataGeracao: a.dataGeracao,
        };
      });
  });

  protected readonly pendenciasFiltradas = computed<Pendencia[]>(() => {
    const filtro = this.categoriaFiltro();
    if (filtro === 'todos') return MOCK_PENDENCIAS;
    return MOCK_PENDENCIAS.filter((p) => p.categoria === filtro);
  });

  // --- Helpers de template ---

  protected formatarNumero(n: number): string {
    return n.toLocaleString('pt-BR');
  }

  protected perfilLabel(tipo: TipoPerfil): string {
    return PERFIL_LABELS[tipo] ?? tipo;
  }

  protected categoriaLabel(cat: CategoriaPendencia): string {
    return CATEGORIA_LABELS[cat] ?? cat;
  }

  protected iniciais(nome: string): string {
    return nome
      .split(' ')
      .filter((p) => p.length > 2)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  protected riscoClasse(nivel: string): string {
    const map: Record<string, string> = {
      critico: 'risk-indicator__dot--critical',
      alto: 'risk-indicator__dot--high',
      medio: 'risk-indicator__dot--medium',
      baixo: 'risk-indicator__dot--low',
    };
    return map[nivel] || '';
  }

  protected isTagFaccao(rotulo: string, categoria?: string): boolean {
    return categoria === 'classificacao-criminal';
  }

  protected formatarData(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  protected formatarDataHora(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  // --- Navigation ---

  protected navegarCadastro(): void {
    this.router.navigate(['/intelligence/person/registration']);
  }

  protected toggleFiltros(): void {
    this.filtrosAbertos.update((v) => !v);
  }

  /** Reload the page to retry the API call (PersonDataService initializes on construction). */
  protected retryLoad(): void {
    window.location.reload();
  }

  protected aplicarFiltros(): void {
    this.filtrosAbertos.set(false);
  }

  protected navegar(rota: string, queryParams?: Record<string, string>): void {
    this.router.navigate([rota], queryParams ? { queryParams } : undefined);
  }

  protected fecharResultados(event: Event, tabId: string): void {
    event.stopPropagation();
    const tabs = this.tabsBusca();
    const idx = tabs.findIndex((t) => t.id === tabId);
    this.tabsBusca.update((ts) => ts.filter((t) => t.id !== tabId));
    if (this.tabAtivaId() === tabId) {
      const remaining = this.tabsBusca();
      this.tabAtivaId.set(
        remaining.length > 0 ? remaining[Math.max(0, idx - 1)].id : 'monitorados',
      );
    }
    if (this.tabsBusca().length === 0) {
      this.termoBusca.set('');
    }
  }

  protected buscar(): void {
    if (!this.buscaAtiva()) return;
    const termo = this.termoBusca();

    const existente = this.tabsBusca().find((t) => t.termo.toLowerCase() === termo.toLowerCase());
    if (existente) {
      this.tabAtivaId.set(existente.id);
      return;
    }

    const id = `busca-${Date.now()}`;
    const novaTab: TabBusca = { id, termo, carregando: true, resultados: [], total: 0 };
    this.tabsBusca.update((ts) => [...ts, novaTab]);
    this.tabAtivaId.set(id);

    requestAnimationFrame(() => {
      const el = document.querySelector('.feed-tabs__scroll');
      if (el) el.scrollLeft = el.scrollWidth;
    });

    setTimeout(() => {
      const resultados = this.monitorados().slice(0, 5);
      this.tabsBusca.update((ts) =>
        ts.map((t) =>
          t.id === id ? { ...t, carregando: false, resultados, total: resultados.length } : t,
        ),
      );
    }, 1500);
  }

  protected limparBusca(): void {
    this.termoBusca.set('');
  }

  protected listarPorCategoria(perfil: string | null): void {
    if (!perfil) return;

    const existente = this.tabsListagem().find((t) => t.perfil === perfil);
    if (existente) {
      this.tabAtivaId.set(existente.id);
      return;
    }

    const opcao = this.categoriasPessoa.find((c) => c.value === perfil);
    const distribuicao = this.distribuicaoPerfis.find((d) => d.perfil === perfil);
    const id = `listagem-${perfil}`;
    const novaTab: TabListagem = {
      id,
      perfil,
      label: opcao?.label ?? perfil,
      total: distribuicao?.total ?? 0,
      carregando: true,
      cards: [],
    };

    this.tabsListagem.update((ts) => [...ts, novaTab]);
    this.tabAtivaId.set(id);
    setTimeout(() => this.categoriaSelecionada.set(null), 0);

    setTimeout(() => {
      this.tabsListagem.update((ts) =>
        ts.map((t) =>
          t.id === id ? { ...t, carregando: false, cards: this.monitorados().slice(0, 16) } : t,
        ),
      );
    }, 1500);
  }

  protected fecharListagem(event: Event, tabId: string): void {
    event.stopPropagation();
    const tabs = this.tabsListagem();
    const idx = tabs.findIndex((t) => t.id === tabId);
    this.tabsListagem.update((ts) => ts.filter((t) => t.id !== tabId));
    if (this.tabAtivaId() === tabId) {
      const remaining = this.tabsListagem();
      this.tabAtivaId.set(
        remaining.length > 0 ? remaining[Math.max(0, idx - 1)].id : 'monitorados',
      );
    }
  }

  protected navegarPessoa(pessoaId: string): void {
    this.router.navigate(['/intelligence/person', pessoaId]);
  }

  protected navegarPendencia(pendencia: Pendencia): void {
    if (pendencia.categoria === 'deduplicacao') {
      // TODO: route to duplicates page when implemented
    } else {
      this.router.navigate(['/intelligence/person', pendencia.pessoa.id]);
    }
  }

  protected toggleOrdenacaoData(): void {
    this.ordenacao.set(this.ordenacao() === 'data' ? null : 'data');
  }

  protected toggleOrdenacaoAlfa(): void {
    if (this.ordenacao() === 'az') this.ordenacao.set('za');
    else if (this.ordenacao() === 'za') this.ordenacao.set(null);
    else this.ordenacao.set('az');
  }

  protected paginaAnterior(): void {
    const atual = this.paginaMonitorados();
    if (atual > 0) this.paginaMonitorados.set(atual - 1);
  }

  protected proximaPagina(): void {
    const atual = this.paginaMonitorados();
    if (atual < this.totalPaginas() - 1) this.paginaMonitorados.set(atual + 1);
  }

  protected selecionarCategoria(valor: string): void {
    this.categoriaFiltro.set(valor);
  }

  // --- Alertas dos cards ---

  protected getAlertaIndex(id: string): number {
    return this.alertaIndices()[id] ?? 0;
  }

  protected isBuscando(id: string): boolean {
    return this.buscandoAlertas().has(id);
  }

  protected getAnimacao(id: string): string | null {
    return this.alertaAnimacao()[id] ?? null;
  }

  protected alertaAnterior(id: string, total: number, event: Event): void {
    event.stopPropagation();
    const idx = this.getAlertaIndex(id);
    if (idx <= 0) return;
    this.alertaAnimacao.update((m) => ({ ...m, [id]: 'slide-down' }));
    setTimeout(() => {
      this.alertaIndices.update((m) => ({ ...m, [id]: idx - 1 }));
      this.alertaAnimacao.update((m) => ({ ...m, [id]: null }));
    }, 200);
  }

  protected alertaProximo(id: string, total: number, event: Event): void {
    event.stopPropagation();
    const idx = this.getAlertaIndex(id);
    if (idx >= total - 1) return;
    this.alertaAnimacao.update((m) => ({ ...m, [id]: 'slide-up' }));
    setTimeout(() => {
      this.alertaIndices.update((m) => ({ ...m, [id]: idx + 1 }));
      this.alertaAnimacao.update((m) => ({ ...m, [id]: null }));
    }, 200);
  }

  protected simularBusca(id: string, event: Event): void {
    event.stopPropagation();
    this.buscandoAlertas.update((s) => {
      const n = new Set(s);
      n.add(id);
      return n;
    });
    setTimeout(() => {
      this.buscandoAlertas.update((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, 2000);
  }

  protected formatarDataCurta(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  // --- Paginação simulada ---

  protected readonly opcoesPagina = [
    { label: 'Página 1', value: 1 },
    { label: 'Página 2', value: 2 },
    { label: 'Página 3', value: 3 },
    { label: 'Página 4', value: 4 },
  ];

  protected readonly paginasVisiveis = computed(() => {
    const atual = this.paginaSimulada();
    const total = this.totalPaginasSimuladas;
    const paginas: number[] = [];
    for (let p = Math.max(2, atual - 2); p <= Math.min(total - 1, atual + 2); p++) {
      paginas.push(p);
    }
    return paginas;
  });

  protected irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasSimuladas || pagina === this.paginaSimulada())
      return;
    this.carregandoPagina.set(true);
    this.paginaSimulada.set(pagina);
    setTimeout(() => this.carregandoPagina.set(false), 1500);
  }

  protected paginaSimuladaAnterior(): void {
    this.irParaPagina(this.paginaSimulada() - 1);
  }

  protected paginaSimuladaProxima(): void {
    this.irParaPagina(this.paginaSimulada() + 1);
  }
}
