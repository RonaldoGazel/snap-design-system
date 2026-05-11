# POI Dashboard — API Contract Divergences

## Context

This document compares the data contract expected by the **PrototipoPOI** prototype UI (source of truth for visual rendering, see `file:///C:/Users/victor.salles/Downloads/ingestion-prototype/prototype/persons-dashboard.html` + `data.js`) against what the **platform-frontend** actually receives from the POI service list endpoint.

The goal is to identify fields that the UI needs to render the person card grid and the right-hand dashboard widgets correctly, but that the API either doesn't provide, provides in a different format, or provides with insufficient data.

> **Note**: This document is an analysis only. No code changes were made to the contract or the mapper. It lists what the API must return to respect the UI contract expected by the prototype.

---

## API Endpoint

- **URL**: `GET /api/v1/poi/person/list?limit=200`
- **Proxy target**: `http://localhost:8003/api/v1/poi/person/list`
- **Auth**: Bearer token (Keycloak, realm `platform`, client `platform-frontend`)
- **Frontend mapper**: `mapApiPersonListToPessoas()` → `mapApiPersonToPessoa()` in `src/app/features/person/services/api-person-mapper.ts`
- **Consumer**: `PersonDataService.pessoas` signal → `DashboardComponent.monitorados` computed → person card grid

---

## Live evidence — captured API response

Captured on **2026-05-07** from the running environment (`localhost:8003`), 17 items returned.

Response metadata:

```json
{
  "total": 17,
  "total_merged": 17,
  "total_raw": 17,
  "limit": 200,
  "offset": 0
}
```

Representative item (full) — as returned by the API:

```json
{
  "uuid": "98e1902a-7661-4fab-b8a4-19ae2b9fc536",
  "nome": "ERIC FERREIRA PEREIRA DE OLIVEIRA",
  "cpf": "09321218610",
  "data_nascimento": "01/12/1987",
  "sexo": "MASCULINO",
  "mae": "MARIA DA CONCEICAO FERREIRA PEREIRA",
  "nacionalidade": "BRASILEIRO",
  "vulgos": ["ERIC FERREIRA PEREIRA"],
  "fonte": "SNAP",
  "renda_estimada": "10000",
  "pais_passaporte": "BRASIL",
  "status_receita": "REGULAR",
  "id": "98e1902a-7661-4fab-b8a4-19ae2b9fc536",
  "perfis": [],
  "fontes": [{ "tipo": "SNAP", "status": "ativo" }],
  "resumoAnalitico": "",
  "statusReconciliacao": "sem_divergencia",
  "tagsRelevantes": [],
  "_sources": [
    { "graph_id": "d103e015-df2a-475b-a284-992bdb3bb92b", "display_name": "Grafo Publico" }
  ],
  "_merged_from": 1
}
```

All 17 items consistently share:

- `perfis: []` (empty)
- `tagsRelevantes: []` (empty)
- `resumoAnalitico: ""` (empty)
- `statusReconciliacao: "sem_divergencia"`
- Single-source `fontes: [{ "tipo": "SNAP", "status": "ativo" }]`
- No `fotoUrl` / `foto_url` key at all
- No `indicadoresAnaliticos` key
- No `monitoramento` key
- No `situacaoPrisionalAtual` key
- No `rotulos` key

Full captured response: [`./assets/poi-person-list-response.network-response`](./assets/poi-person-list-response.network-response).

---

## What PrototipoPOI expects — UI-contract person shape

Derived from the `persons` array in `data.js` and from the DOM fields consumed by `persons-dashboard.html` / `persons-dashboard.css`. Every field below is read by the prototype card rendering or filtering logic.

```ts
interface UiPerson {
  id: string;                    // card key + click target
  nome: string;                  // h3 title
  vulgos: string[];              // italic alias line under the name
  fotoUrl: string | null;        // 3:4 photo with fallback initials
  perfilPrincipal:               // profile tag overlay on photo (lowercase)
    | 'preso' | 'ex-preso' | 'visitante' | 'familiar'
    | 'advogado' | 'alvo' | 'pessoa-relacionada' | 'servidor';
  flaggedAlvo: boolean;          // if true, overrides perfil visual with "alvo"
  indicadoresAnaliticos: {
    nivelRisco: 'critico' | 'alto' | 'medio' | 'baixo';  // risk dot + label
    qtdAlertas: number;          // red badge in card top-right corner
  };
  tagsRelevantes: Array<{
    rotulo: string;              // text shown inside .ptag
    categoria: string;           // 'classificacao-criminal' → faction styling
    cor?: string;                // optional override color
  }>;
  alertas: Array<{
    data: string;                // date shown in .pcard__alert-date
    texto: string;               // body text (2-line clamp)
  }>;                            // multiple → chevron nav between items
  fontes: Array<{
    tipo: 'sipen' | 'snap' | 'manual';
    prioridade: number;
    status: 'ativa' | 'divergente' | 'reconciliada';
  }>;
  monitoramento: {
    monitorado: boolean;         // filter for "MONITORADOS" tab
    alvo: boolean;
    criticidade?: 'critica' | 'alta' | 'media' | 'baixa';
  };
}
```

---

## Summary of divergences

| # | Field | Prototype UI expects | API returns | Impact on rendering |
|---|-------|----------------------|-------------|----------------------|
| 1 | `indicadoresAnaliticos.nivelRisco` | `'critico' \| 'alto' \| 'medio' \| 'baixo'` | **absent** | Every risk dot is green (fallback `'baixo'`); risk filter is a no-op. |
| 2 | `indicadoresAnaliticos.qtdAlertas` / `alertCount` | Integer ≥ 0 | **absent** | The red alert-count badge never appears (`m.alertas.length` in code uses a single synthetic "Alerta registrado" entry, so the badge shows `1` for every person regardless of reality). |
| 3 | `tagsRelevantes[]` | Populated array with `rotulo`, `categoria`, optional `cor` | `[]` for every item | No tag chips (faction badges, analytical signals) ever appear under the name. |
| 4 | `perfis[]` | Non-empty with `tipo` | `[]` for every item | Profile tag overlay is always `preso` (falls through `derivePerfilFromRotulos([])` → first entry defaults to `'preso'`). Multi-role persons cannot be expressed. |
| 5 | `rotulos` | JSON string or array to derive `perfis` from | **absent** | The mapper’s fallback `derivePerfilFromRotulos` has no input to work with. |
| 6 | `fotoUrl` / `foto_url` | URL string to a 3:4 image | **absent** | Every card shows the initials placeholder; visual recognition is lost. |
| 7 | `vulgos[]` | At least one known alias | `[]` for most items (1 of 17 has a value, but it's a name variant, not an alias) | The italic `"Nickname"` line is almost always empty. |
| 8 | `resumoAnalitico` | Rich analytical text (≥ 60 chars) | `""` for every item | The alert area shows the placeholder `"Alerta registrado"` everywhere. |
| 9 | `alertas[]` | Per-person array with `{data, texto}` | **absent** | The mapper fabricates a single entry `{ data: '2025-01-10T14:32:00', texto: 'Alerta registrado' }` per person. Alert-nav chevrons never appear (never more than one item). |
| 10 | `monitoramento.monitorado` | Boolean flag | **absent** | Nothing can be filtered to just monitored persons; the "MONITORADOS" tab shows the entire base. |
| 11 | `flaggedAlvo` | Boolean | **absent** | No person can be visually marked as `alvo` via the profile band. |
| 12 | `situacaoPrisionalAtual` | Object with `unidade`, `regime`, `status` | **absent** | Not required by this screen, but needed by the person profile view. Listed for completeness. |
| 13 | `fontes[].tipo` casing | Lowercase `sipen \| snap \| manual` | Uppercase `"SNAP"` | Mapper normalises this — no user-visible impact, but noted. |
| 14 | `fontes[].prioridade`, `dataConsulta` | Number / ISO date | `{ tipo, status }` only | Lost; provenance ordering defaults to 0 for everyone. |
| 15 | `_sources[].display_name` values | Human-readable | `"Grafo Publico"` (typo, missing accent) | Minor — copy issue on the source side. |

---

## Right-sidebar divergences

### Recent alerts (`MOCK_ALERTAS` → `alertasRecentes`)

The right-sidebar "Alertas recentes" list is populated from `personData.alertas()` (a static mock in `alertas.data.ts`). Each alert carries a `pessoaId` which is cross-referenced against `pessoas()` to show the person’s name and photo.

Live evidence (current rendering):

- Every alert row shows **"Pessoa desconhecida"** and a **"PD"** initials placeholder.
- This happens because `MOCK_ALERTAS` uses `pessoaId: 'p1' … 'p8'` (from the old SIPEN mock fixture) but the API returns UUIDs such as `98e1902a-7661-4fab-b8a4-19ae2b9fc536`. The `getPessoaById()` lookup never resolves, so the name falls through to the `'Pessoa desconhecida'` default.

This is not a mapper bug, it's a data-coupling gap: either the API must ship alerts too (recommended, since alerts are part of the person domain) or the static alert fixture must be reset once the API has seed data.

Prototype UI contract for alert items:

```ts
interface UiRecentAlert {
  personId: string;           // must match an id in the persons list
  personName: string;
  photo: string | null;       // 42×56px thumbnail
  alertType: string;          // e.g. "Novo Vínculo Sensível"
  source: 'manual' | 'sipen' | 'snap';  // colored badge
  timestamp: string;          // short "dd/MM HH:mm" style
}
```

### Distribution bar

The 7-segment distribution bar and its legend are populated from a hardcoded `DISTRIBUICAO_PERFIS` constant in `dashboard.component.ts` (`TOTAL_BASE = 51438`). These values never reflect the API. The prototype also hardcodes them, so this is **in line with the prototype** — no divergence, listed here for transparency.

### Pendencies

`MOCK_PENDENCIAS` is entirely hardcoded in `dashboard.component.ts`, matching the prototype in structure and count. Not part of any API contract today — noted for completeness.

---

## Detailed evidence — field-by-field

### 1. `indicadoresAnaliticos` — not returned

**What the prototype expects:**

```js
// data.js (prototype)
{ id: 'p-001', risk: 'critico', alertCount: 1, … }
```

Rendered in `persons-dashboard.html`:

```html
<span class="pcard__risk-dot is-${p.risk}"></span>
<span>${riskLabel}</span>  <!-- Risco crítico / alto / médio / baixo -->
```

And the badge:

```html
${p.alertCount > 0 ? `<span class="pcard__alertbadge">${p.alertCount}</span>` : ''}
```

**What the API returns for the same concept:** nothing — no `indicadoresAnaliticos` or `risk` key exists on any of the 17 items.

**What the mapper produces:** `indicadoresAnaliticos: undefined`. In the component, `(p.indicadoresAnaliticos?.nivelRisco ?? 'baixo')` always resolves to `'baixo'`.

**Required API shape** (the target contract):

```json
{
  "indicadoresAnaliticos": {
    "nivelRisco": "critico",
    "relevancia": 95,
    "periculosidade": "Máxima",
    "qtdAlertas": 3,
    "qtdVinculos": 5,
    "qtdDocumentosCitantes": 7
  }
}
```

---

### 2. `tagsRelevantes` — empty for every item

**What the prototype expects:**

```js
// data.js
tags: [
  { t: 'CV', kind: 'faction' },
  { t: 'Influente', kind: 'signal' }
]
```

Rendered:

```html
<span class="ptag kind-${t.kind}">${t.t}</span>
```

The faction tag has a pillar-tinted background via `.ptag.kind-faction`. Without tags, this whole visual layer is missing.

**What the API returns:** `"tagsRelevantes": []` on every item.

**Required API shape:**

```json
{
  "tagsRelevantes": [
    {
      "id": "tag-1",
      "rotulo": "CV",
      "categoria": "classificacao-criminal",
      "cor": "#DC2626",
      "dataAplicacao": "2024-01-15"
    }
  ]
}
```

Mapping table (prototype `kind` → expected `categoria`):

| Prototype `kind` | Expected `categoria` | Visual treatment |
|------------------|----------------------|------------------|
| `faction` | `classificacao-criminal` | Pillar-tinted badge (coral-ish on dark, wine on light) |
| `signal` | `sinal-analitico` / `monitoramento` / `status-operacional` | Neutral surface-3 badge |

---

### 3. `perfis` — empty, profile overlay always falls through to "preso"

**What the prototype expects:**

```js
// data.js
{ profile: 'preso' | 'ex-preso' | 'visitante' | 'familiar' | 'advogado' | 'servidor',
  flaggedAlvo: true | false }
```

The visual rule in `persons-dashboard.html`:

```js
const profileLabel = p.flaggedAlvo ? 'alvo' : p.profile;
const profileClass = p.flaggedAlvo ? 'is-alvo' : `is-${p.profile}`;
```

The `<span class="pcard__profile-tag is-alvo">alvo</span>` is the colored band at the bottom of the photo (or inline when no photo).

**What the API returns:** `perfis: []` on every item. The mapper then calls `derivePerfilFromRotulos(rotulos ?? [])`, but `rotulos` is also absent, so `perfis` ends up `[]` in the model too.

**Current fallback in the component:**

```ts
const perfilPrincipal = perfis[0]?.tipo ?? ('preso' as TipoPerfil);
```

Consequence: every card’s overlay says **preso**, regardless of the actual profile, and `alvo` / `visitante` / `advogado` / `familiar` / `servidor` / `ex-preso` / `pessoa-relacionada` are never visually distinguishable.

**Required API shape (preferred):**

```json
{
  "perfis": [
    {
      "tipo": "preso",
      "ativo": true,
      "dataInicio": "2019-08-15",
      "detalhes": { "regime": "Fechado", "unidade": "UPRJ Bangu III" }
    },
    { "tipo": "alvo", "ativo": true, "dataInicio": "2024-06-01", "detalhes": {} }
  ]
}
```

**Alternative (if only labels are available):** ship a full-coverage `rotulos` array so the mapper’s `derivePerfilFromRotulos` can work:

```json
{ "rotulos": ["Person", "Inmate", "Target"] }
```

…and extend the mapping in `api-person-mapper.ts` (`rotuloToTipo`) to cover `Ex-inmate → ex-preso`, `Family → familiar`, `Target → alvo`, `Staff → servidor`, and `RelatedPerson → pessoa-relacionada`. Today it only covers `Inmate`, `Visitor`, and `Lawyer`.

---

### 4. `fotoUrl` — absent from every item

**What the prototype expects:** `photo: "../assets/photos/pessoa-01.png"`, rendered in a fixed 91 × (91×4/3) px wrapper with a profile-tag band at the bottom. When absent, an initials placeholder takes its place — but the prototype’s dataset has photos for most profiles.

**What the API returns:** no `fotoUrl` / `foto_url` key on any of the 17 items.

**Required API shape:**

```json
{ "foto_url": "https://storage.example.com/poi/photos/<uuid>.jpg" }
```

The frontend accepts either `fotoUrl` or `foto_url` (snake_case), so either casing works.

---

### 5. `vulgos` — populated for 1 of 17 items, and the single value is a name variant, not an alias

**Live evidence:** only `ERIC FERREIRA PEREIRA DE OLIVEIRA` has `vulgos: ["ERIC FERREIRA PEREIRA"]` — which is a name shortening, not an alcunha. The remaining 16 items have `vulgos: []`.

**Prototype expectation:** analytical aliases such as `"Carlota"`, `"Bigode"`, `"Fabão"` — short, informal, operationally meaningful.

The alias line is the primary vector for recognising a person in intelligence work; this field is critical.

---

### 6. `resumoAnalitico` — empty string for every item

**What the prototype expects:** short, intelligence-oriented phrases, e.g.

> "Presa de alta periculosidade com vínculo faccional confirmado"
> "Alvo prioritário com identidade incompleta. Conhecido apenas por alcunha."

**What the API returns:** `"resumoAnalitico": ""` on every item.

**Component fallback:** synthesises a single alert with the first 60 chars of `resumoAnalitico`, falling through to `'Alerta registrado'` when empty. Today every card reads `"Alerta registrado"` with date `10/01/25 14:32`.

This combined with the missing `alertas[]` array (item 9) means the alert section is effectively a no-op placeholder.

---

### 7. `monitoramento` — missing, so "MONITORADOS" tab shows the entire base

**Prototype behaviour:** `persons-dashboard.html` filters cards by `p.monitoramento?.monitorado === true` (implicitly — the prototype dataset is already a monitored subset, 16 items by design).

**Platform-frontend behaviour today:** the `monitorados` computed signal returns **every person** the API returned (17 of them, with duplicates — e.g. `MARIA DA CONCEICAO FERREIRA PEREIRA` appears 5 times). The tab label `MONITORADOS` is therefore misleading.

**Required API shape:**

```json
{
  "monitoramento": {
    "monitorado": true,
    "alvo": false,
    "dataInicioMonitoramento": "2023-04-01",
    "setorResponsavel": "Subsecretaria de Inteligência",
    "criticidade": "critica"
  }
}
```

Alternatively, add a `monitored=true` query parameter on `/person/list`, or create a dedicated `/person/list/monitored` endpoint to make the filter explicit at the service boundary.

---

### 8. Alerts sidebar — `pessoaId` refers to obsolete fixture IDs

**Symptom:** every row of the right-hand "Alertas recentes" card renders **"Pessoa desconhecida"** and the `"PD"` initials.

**Root cause:** `MOCK_ALERTAS` in `src/app/features/person/data/alertas.data.ts` carries `pessoaId: 'p1' … 'p8'`, which belonged to the old SIPEN mock fixture. The live API returns UUIDs, so the `getPessoaById()` lookup always returns `undefined` and the display falls through to the default.

**Prototype UI contract for this list:**

```ts
interface UiRecentAlert {
  personId: string;
  personName: string;
  photo: string | null;    // 3:4 thumbnail (42px wide)
  alertType: string;       // e.g. "Alteração Periculosidade"
  source: 'manual' | 'sipen' | 'snap';
  timestamp: string;       // "dd/MM HH:mm"
}
```

**Required API shape** (assuming alerts become part of the person service):

```json
GET /api/v1/poi/alerts/recent?limit=8
{
  "items": [
    {
      "id": "alerta-1",
      "pessoa_id": "98e1902a-7661-4fab-b8a4-19ae2b9fc536",
      "pessoa_nome": "ERIC FERREIRA PEREIRA DE OLIVEIRA",
      "foto_url": "https://…/eric.jpg",
      "tipo": "novo-vinculo-sensivel",
      "severidade": "alta",
      "fonte": "snap",
      "data_geracao": "2025-01-09T20:10:00Z"
    }
  ]
}
```

---

## Prioritisation

| Rank | Field | Rationale |
|------|-------|-----------|
| P0 | `indicadoresAnaliticos.nivelRisco` | Without it, the main analytical signal (risk) is gone for every person and the risk filter is broken. |
| P0 | `monitoramento.monitorado` | "MONITORADOS" is the default tab; without this flag, the screen is misleading. |
| P1 | `tagsRelevantes[]` | Faction + signal chips are the density-giving visual layer of every card. |
| P1 | `perfis[]` (or expanded `rotulos`) | Profile overlay colour-codes every card; today every card says "preso". |
| P1 | `foto_url` | Intelligence domain prioritises visual recognition; initials-only severely reduces usefulness. |
| P2 | `vulgos[]` | Aliases are the primary operational identifier when formal IDs are incomplete. |
| P2 | `resumoAnalitico` | Powers the alert-area placeholder; without it the area looks broken. |
| P2 | `alertas[]` (real per-person array) | Needed to enable chevron navigation and the badge count. |
| P3 | `alerts/recent` endpoint | Fixes the "Pessoa desconhecida" sidebar (also requires either shipping alerts via the API or wiring alert IDs to real person UUIDs). |
| P3 | `_sources[].display_name` typo | `"Grafo Publico"` → `"Grafo Público"`. Cosmetic. |

---

## Non-divergences (consumed correctly today)

These fields **do** flow through the mapper and render correctly, listed for completeness:

- `id` / `uuid` → used as card key and click target (`navegarPessoa`)
- `nome` → card `h3`
- `cpf`, `rg`, `data_nascimento`, `sexo`, `mae`, `nacionalidade` → not used on the dashboard, but preserved on the `Pessoa` model for the profile view
- `fontes[].tipo` (uppercase) → normalised to lowercase by `normaliseFonteTipo`
- `fontes[].status` (`"ativo"`) → normalised to `"ativa"` by `normaliseFonteStatus`
- `statusReconciliacao` (`"sem_divergencia"`) → normalised to `"sem-divergencia"` by `normaliseStatusDivergencia`
- `_sources[]`, `_merged_from` → rendered as the "Grafo Publico" provenance pill and a merge-count badge when > 1

---

## Visual evidence attached

- Raw API response captured live: [`./assets/poi-person-list-response.network-response`](./assets/poi-person-list-response.network-response)

---

## Last updated

2026-05-07 — captured from a live run of platform-frontend against `localhost:8003`, user `admin@snap.local`, 17 persons in the base, all from the SNAP graph "Grafo Publico".
