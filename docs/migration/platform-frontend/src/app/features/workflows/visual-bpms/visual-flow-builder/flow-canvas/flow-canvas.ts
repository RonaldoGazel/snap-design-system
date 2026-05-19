import {
  Component,
  input,
  output,
  computed,
  signal,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectionStrategy,
  afterNextRender,
} from '@angular/core';

import {
  BpmsVisualFlowStage,
  BpmsVisualFlowStageProfile,
  BpmsVisualFlowConnection,
  ConnectionType,
} from '../../../models/visual-bpms.model';

import { BpmsOrgUnit } from '../../../models/bpms.model';

import { ConnectionTypeVisibility } from '../connection-legend/connection-legend';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Layout constants
export const CARD_WIDTH = 316;           // visual card width (372 * 0.85)
export const STAGE_COLUMN_WIDTH = 524;   // total column slot width (616 * 0.85)
export const STAGE_COLUMN_GAP = 20;      // minimal gap between column slots
export const CARD_MARGIN = (STAGE_COLUMN_WIDTH - CARD_WIDTH) / 2;
export const STAGE_HEADER_HEIGHT = 90; // headers inside canvas, sticky via JS
export const CARD_HEIGHT = 96;           // card height (72 * 1.33)
export const CARD_GAP = 32;
export const CANVAS_PADDING = 40;
export const CONNECTOR_RADIUS = 7;

/** X position of the column slot (left edge) */
export function getStageX(orderIndex: number): number {
  return CANVAS_PADDING + orderIndex * (STAGE_COLUMN_WIDTH + STAGE_COLUMN_GAP);
}

/** X position of the card (centered within the column slot) */
export function getCardX(orderIndex: number): number {
  return getStageX(orderIndex) + CARD_MARGIN;
}

export function getProfileY(profileIndex: number): number {
  return CANVAS_PADDING + STAGE_HEADER_HEIGHT + 16 + profileIndex * (CARD_HEIGHT + CARD_GAP);
}

export function classifyConnection(
  sourceStageProfileId: string,
  targetStageProfileId: string,
  stages: BpmsVisualFlowStage[],
): ConnectionType {
  if (sourceStageProfileId === targetStageProfileId) {
    return 'AUTO_REFERENCIA';
  }
  let sourceStage: BpmsVisualFlowStage | undefined;
  let targetStage: BpmsVisualFlowStage | undefined;
  for (const stage of stages) {
    for (const p of stage.profiles ?? []) {
      if (p.id === sourceStageProfileId) sourceStage = stage;
      if (p.id === targetStageProfileId) targetStage = stage;
    }
  }
  if (!sourceStage || !targetStage) return 'AVANCO';
  if (sourceStage.id === targetStage.id) return 'INTRA_ETAPA';
  if (sourceStage.order_index < targetStage.order_index) return 'AVANCO';
  return 'RETORNO';
}

function verbPlural(verb: string): string {
  switch (verb) {
    case 'envia': return 'enviam';
    case 'devolve': return 'devolvem';
    case 'repassa': return 'repassam';
    default: return verb;
  }
}

interface ConnectorPos {
  x: number;
  y: number;
}

interface ConnectionPath {
  id: string;
  d: string;
  type: ConnectionType;
  markerX: number;
  markerY: number;
  markerAngle: number;
  tooltip: string;
  sourceProfileIds: string[];
  targetProfileIds: string[];
}

export interface DisplayItem {
  type: 'individual' | 'group';
  id: string;
  label: string;
  sublabel: string;
  memberIds: string[];
  profile?: BpmsVisualFlowStageProfile;
  count: number;
  sectorCount: number;
  groupId?: string;
}

@Component({
  selector: 'app-flow-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule
  ],
  templateUrl: './flow-canvas.html',
  styleUrl: './flow-canvas.css',
})
export class FlowCanvasComponent {
  @ViewChild('canvasContainer') canvasContainer?: ElementRef<HTMLDivElement>;

  /** Tracks the visible container height for ensuring columns fill the viewport. */
  readonly containerVisibleHeight = signal(0);

  constructor() {
    afterNextRender(() => {
      this.updateContainerHeight();
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateContainerHeight();
  }

  private updateContainerHeight(): void {
    const h = this.canvasContainer?.nativeElement.clientHeight ?? 0;
    if (h > 0 && h !== this.containerVisibleHeight()) {
      this.containerVisibleHeight.set(h);
    }
  }

  readonly stages = input.required<BpmsVisualFlowStage[]>();
  readonly connections = input.required<BpmsVisualFlowConnection[]>();
  readonly orgUnits = input<BpmsOrgUnit[]>([]);
  readonly externalGlobalGrouping = input<boolean>(false, { alias: 'globalGrouping' });
  readonly externalGroupLinkMode = input<'all' | 'sector'>('all', { alias: 'groupLinkMode' });
  readonly connectionTypeVisibility = input<ConnectionTypeVisibility>(
    { AVANCO: true, RETORNO: true, INTRA_ETAPA: true, AUTO_REFERENCIA: true, AUTO_LINK: true },
  );
  readonly templateName = input<string>('');

  readonly connectionCreated = output<{ sourceStageProfileId: string; targetStageProfileId: string }>();
  readonly connectionRemoved = output<string>();
  readonly groupConnectionRemoved = output<{ sourceDisplayId: string; targetDisplayId: string }>();
  readonly stageSelected = output<BpmsVisualFlowStage>();
  readonly openProfileDialog = output<BpmsVisualFlowStage>();
  readonly profileContextMenu = output<{ x: number; y: number; profile: BpmsVisualFlowStageProfile; stage: BpmsVisualFlowStage }>();
  readonly profileReordered = output<{ stageId: string; profileId: string; newIndex: number }>();
  readonly groupConnectionCreated = output<{ sourceGroupMemberIds: string[]; targetGroupMemberIds: string[] }>();

  // Grouping state (per-stage toggle)
  readonly groupedStageIds = signal<Set<string>>(new Set());
  readonly ungroupedStageIds = signal<Set<string>>(new Set());
  readonly globalGrouping = signal(false);
  readonly expandedGroupIds = signal<Set<string>>(new Set());
  readonly groupLinkMode = signal<'all' | 'sector'>('all');

  // Per-stage filters
  readonly stageFilters = signal<Map<string, { unitIds: Set<string>; profileIds: Set<string> }>>(new Map());
  readonly filterPopoverStageId = signal<string | null>(null);

  // Visibility popover
  readonly visibilityPopoverStageId = signal<string | null>(null);

  // Hidden profiles (visual only, not persisted)
  readonly hiddenProfileIds = signal<Set<string>>(new Set());

  /** Effective group link mode (external takes precedence). */
  private readonly effectiveGroupLinkMode = computed(() => this.externalGroupLinkMode() ?? this.groupLinkMode());

  // Drag-to-connect state
  readonly dragging = signal(false);

  // Scroll state for sticky headers
  readonly scrollTop = signal(0);
  private rafId = 0;
  readonly dragSourceId = signal<string | null>(null);
  readonly dragSourceMemberIds = signal<string[]>([]);
  readonly dragSourceSide = signal<'right-out' | 'left-out' | null>(null);
  readonly dragLine = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Drag-to-reorder state
  readonly reorderDragging = signal(false);
  readonly reorderProfileId = signal<string | null>(null);
  readonly reorderStageId = signal<string | null>(null);
  readonly reorderGhostY = signal(0);
  private reorderStartY = 0;

  // Hover highlight state
  readonly hoveredProfileId = signal<string | null>(null);
  readonly hoveredConnectionProfileIds = signal<Set<string> | null>(null);

  // Canvas pan state (right-click drag)
  private panning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panScrollStartX = 0;
  private panScrollStartY = 0;

  // Auto-scroll during drag-to-connect
  private static readonly AUTO_SCROLL_EDGE = 60;
  private static readonly AUTO_SCROLL_SPEED = 15;
  private autoScrollRAF = 0;
  private autoScrollDx = 0;
  private autoScrollDy = 0;
  private lastMouseClientX = 0;
  private lastMouseClientY = 0;

  // Zoom state
  readonly zoomLevel = signal(1);
  private static readonly ZOOM_MIN = 0.5;
  private static readonly ZOOM_MAX = 2.0;
  private static readonly ZOOM_STEP = 0.05;

  // Drag hover hint state
  readonly dragHoverTargetId = signal<string | null>(null);
  readonly dragHoverGroupMemberIds = signal<string[]>([]);
  readonly dragHoverPos = signal<{ x: number; y: number } | null>(null);

  // Generic tooltip state
  readonly tooltipText = signal<string | null>(null);
  readonly tooltipPos = signal<{ x: number; y: number } | null>(null);

  readonly dragHoverHint = computed(() => {
    const sourceId = this.dragSourceId();
    const sourceMemberIds = this.dragSourceMemberIds();
    const targetId = this.dragHoverTargetId();
    const targetGroupMemberIds = this.dragHoverGroupMemberIds();
    if (!this.dragging()) return null;

    const isSourceGroup = sourceMemberIds.length > 1;
    const isTargetGroup = targetGroupMemberIds.length > 0;

    // Need at least one target (individual or group)
    if (!targetId && !isTargetGroup) return null;
    // Need at least one source
    if (!sourceId && sourceMemberIds.length === 0) return null;

    const stages = this.stages();
    const tplName = this.templateName() || 'Documento';

    // Resolve source info
    const effectiveSourceId = sourceId ?? sourceMemberIds[0];
    let sourceName = '';
    let sourceOrderIndex = -1;
    let sourceCount = isSourceGroup ? sourceMemberIds.length : 1;

    // Resolve target info
    const effectiveTargetId = isTargetGroup ? targetGroupMemberIds[0] : targetId;
    let targetName = '';
    let targetStageName = '';
    let targetOrderIndex = -1;
    let targetCount = isTargetGroup ? targetGroupMemberIds.length : 1;

    for (const stage of stages) {
      for (const p of stage.profiles ?? []) {
        if (p.id === effectiveSourceId) {
          sourceName = p.unit_profile?.profile?.name ?? 'Perfil';
          sourceOrderIndex = stage.order_index;
        }
        if (p.id === effectiveTargetId) {
          targetName = p.unit_profile?.profile?.name ?? 'Perfil';
          targetStageName = stage.step_catalog?.name ?? 'Etapa';
          targetOrderIndex = stage.order_index;
        }
      }
    }

    if (!sourceName || !targetName) return null;

    const isSameProfile = !isSourceGroup && !isTargetGroup && effectiveSourceId === effectiveTargetId;
    const isSameStage = sourceOrderIndex === targetOrderIndex;
    const isForward = sourceOrderIndex < targetOrderIndex;
    const mode = this.effectiveGroupLinkMode();

    // Determine verb
    let verb: string;
    if (isSameProfile) {
      verb = 'repassa';
    } else if (isSameStage) {
      verb = 'repassa';
    } else if (isForward) {
      verb = 'envia';
    } else {
      verb = 'devolve';
    }

    // Build source/target labels based on group vs individual
    if (isSourceGroup || isTargetGroup) {
      const isAllMode = mode === 'all';

      let srcLabel: string;
      if (isSourceGroup) {
        srcLabel = isAllMode
          ? `Todos Perfis ${sourceName} (${sourceCount}) ${verbPlural(verb)}`
          : `${sourceName} de um Setor ${verb}`;
      } else {
        srcLabel = `${sourceName} ${verb}`;
      }

      let tgtLabel: string;
      if (isTargetGroup) {
        tgtLabel = isAllMode
          ? `${targetStageName} de Todos Perfis ${targetName} (${targetCount})`
          : `${targetStageName} de ${targetName} do Mesmo Setor`;
      } else {
        tgtLabel = `${targetStageName} de ${targetName}`;
      }

      return `${srcLabel}\n${tplName} para\n${tgtLabel}`;
    }

    // Individual to individual (existing logic)
    let targetLabel: string;
    if (isSameProfile) {
      targetLabel = `${tplName} para\n${targetStageName} de Outro ${targetName}`;
    } else {
      targetLabel = `${tplName} para\n${targetStageName} de ${targetName}`;
    }

    return `${sourceName} ${verb}\n${targetLabel}`;
  });
  readonly highlightedProfileIds = computed(() => {
    const connHover = this.hoveredConnectionProfileIds();
    if (connHover) return connHover;
    const hovered = this.hoveredProfileId();
    if (!hovered) return null;
    const ids = new Set<string>([hovered]);
    for (const c of this.connections()) {
      if (c.source_stage_profile_id === hovered) ids.add(c.target_stage_profile_id);
      if (c.target_stage_profile_id === hovered) ids.add(c.source_stage_profile_id);
    }
    return ids;
  });

  readonly canvasWidth = computed(() => {
    const count = this.filteredStages().length;
    if (count === 0) return 600;
    return CANVAS_PADDING * 2 + count * STAGE_COLUMN_WIDTH + (count - 1) * STAGE_COLUMN_GAP;
  });

  readonly canvasHeight = computed(() => {
    const maxItems = Math.max(1, ...this.filteredStages().map((s) => this.getDisplayItems(s).length));
    const contentHeight = CANVAS_PADDING * 2 + STAGE_HEADER_HEIGHT + 16 + maxItems * (CARD_HEIGHT + CARD_GAP) + 40;
    // Ensure columns fill at least the visible container height
    const visibleHeight = this.containerVisibleHeight() / Math.max(this.zoomLevel(), 0.1);
    return Math.max(contentHeight, visibleHeight);
  });

  /** Stages with only visible profiles (filtered per-stage). Used for rendering. */
  readonly filteredStages = computed(() => {
    const stages = this.stages();
    const stageFilters = this.stageFilters();

    return stages.map((stage) => {
      const allProfiles = stage.profiles ?? [];
      const f = stageFilters.get(stage.id);
      const hasFilter = f && (f.unitIds.size > 0 || f.profileIds.size > 0);

      const filtered = hasFilter
        ? allProfiles.filter((p) => {
            const unitId = p.unit_profile?.unit_id ?? '';
            const profileId = p.unit_profile?.profile_id ?? '';
            const matchesUnit = f!.unitIds.size === 0 || f!.unitIds.has(unitId);
            const matchesProfile = f!.profileIds.size === 0 || f!.profileIds.has(profileId);
            return matchesUnit && matchesProfile;
          })
        : allProfiles;

      // Also exclude hidden profiles
      const hidden = this.hiddenProfileIds();
      const visibleProfiles = hidden.size > 0
        ? filtered.filter((p) => !hidden.has(p.id))
        : filtered;
      return { ...stage, visibleProfiles };
    });
  });

  /** Visible profile IDs set for fast lookup in connection filtering. */
  private readonly visibleProfileIds = computed(() => {
    const ids = new Set<string>();
    for (const stage of this.filteredStages()) {
      for (const p of stage.visibleProfiles) ids.add(p.id);
    }
    return ids;
  });

  /** Connections where both endpoints are visible. */
  readonly filteredConnections = computed(() => {
    const visible = this.visibleProfileIds();
    return this.connections().filter(
      (c) => visible.has(c.source_stage_profile_id) && visible.has(c.target_stage_profile_id),
    );
  });

  readonly connectionPaths = computed(() => {
    const conns = this.filteredConnections();
    const laneMap = this.allocateLanes(conns);
    const spreadMap = this.allocateSpreadOffsets(conns);
    return conns
      .map((conn) => this.buildConnectionPath(conn, laneMap.get(conn.id) ?? 0, spreadMap.get(conn.id) ?? 0))
      .filter(Boolean) as ConnectionPath[];
  });

  /** Auto-links: same unit_profile_id in adjacent stages (order_index and order_index+1). */
  readonly autoLinks = computed(() => {
    const stages = this.filteredStages();
    const sorted = [...stages].sort((a, b) => a.order_index - b.order_index);

    // First pass: collect all auto-link pairs grouped by column gap
    const gapGroups = new Map<string, Array<{ sourceId: string; targetId: string; srcDisplayIdx: number; tgtDisplayIdx: number; currentOrderIndex: number; nextOrderIndex: number; profileName: string; stageName1: string; stageName2: string }>>();

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (next.order_index !== current.order_index + 1) continue;

      // Build map of unit_profile_id → profile id in next stage
      const nextMap = new Map<string, string>();
      for (const p of next.visibleProfiles) {
        nextMap.set(p.unit_profile_id, p.id);
      }

      // Get display items for position lookup
      const currentDisplayItems = this.getDisplayItems(current);
      const nextDisplayItems = this.getDisplayItems(next);

      // Track which display item pairs we've already linked (for dedup when grouped)
      const seen = new Set<string>();

      const gapKey = `${current.order_index}_${next.order_index}`;
      for (const p of current.visibleProfiles) {
        const targetId = nextMap.get(p.unit_profile_id);
        if (!targetId) continue;

        // Find display item index for source and target
        const srcDisplayIdx = currentDisplayItems.findIndex((item) => item.memberIds.includes(p.id));
        const tgtDisplayIdx = nextDisplayItems.findIndex((item) => item.memberIds.includes(targetId));
        if (srcDisplayIdx < 0 || tgtDisplayIdx < 0) continue;

        const dedupKey = `${srcDisplayIdx}_${tgtDisplayIdx}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const group = gapGroups.get(gapKey) ?? [];
        group.push({
          sourceId: p.id,
          targetId,
          srcDisplayIdx,
          tgtDisplayIdx,
          currentOrderIndex: current.order_index,
          nextOrderIndex: next.order_index,
          profileName: p.unit_profile?.profile?.name ?? 'Perfil',
          stageName1: current.step_catalog?.name ?? 'Etapa',
          stageName2: next.step_catalog?.name ?? 'Etapa',
        });
        gapGroups.set(gapKey, group);
      }
    }

    // Second pass: allocate lanes per gap group and build paths
    const links: Array<{ sourceId: string; targetId: string; d: string; tooltip: string }> = [];
    const laneSpacing = 7;

    for (const [, group] of gapGroups) {
      const totalWidth = (group.length - 1) * laneSpacing;
      const startOffset = -totalWidth / 2;

      for (let j = 0; j < group.length; j++) {
        const item = group[j];
        const laneOffset = startOffset + j * laneSpacing;
        const srcX = getCardX(item.currentOrderIndex) + CARD_WIDTH / 2;
        const srcY = getProfileY(item.srcDisplayIdx);
        const tgtX = getCardX(item.nextOrderIndex) + CARD_WIDTH / 2;
        const tgtY = getProfileY(item.tgtDisplayIdx);
        const stub = 15;
        const r = 8;
        const topSrc: ConnectorPos = { x: srcX, y: srcY - stub };
        const topTgt: ConnectorPos = { x: tgtX, y: tgtY - stub };
        const midX = (srcX + tgtX) / 2 + laneOffset;
        const midPath = this.buildRoundedOrthogonal(topSrc, topTgt, midX, r, 'right');
        // Strip the "M x y" prefix from midPath and prepend our own vertical stub
        const midPathBody = midPath.replace(/^M\s+[\d.e+-]+\s+[\d.e+-]+\s*/, '');
        const d = `M ${srcX} ${srcY} V ${topSrc.y} ${midPathBody} V ${tgtY}`;
        const tooltip = `Conexão automática\n${item.profileName} atua nas duas etapas\n${item.stageName1} → ${item.stageName2}`;
        links.push({ sourceId: item.sourceId, targetId: item.targetId, d, tooltip });
      }
    }

    return links;
  });

  /** Set of profile IDs that participate in auto-links (for showing the top-center dot). */
  readonly autoLinkProfileIds = computed(() => {
    const ids = new Set<string>();
    for (const link of this.autoLinks()) {
      ids.add(link.sourceId);
      ids.add(link.targetId);
    }
    return ids;
  });

  // --- Grouping display model ---

  /** Whether a stage is grouped (per-stage or global, respecting per-stage overrides). */
  isStageGrouped(stageId: string): boolean {
    if (this.ungroupedStageIds().has(stageId)) return false;
    return this.globalGrouping() || this.externalGlobalGrouping() || this.groupedStageIds().has(stageId);
  }

  toggleStageGrouping(stageId: string, event: Event): void {
    event.stopPropagation();
    const isGlobal = this.globalGrouping() || this.externalGlobalGrouping();

    if (isGlobal) {
      // When global is ON, toggle the exception set
      const ungrouped = new Set(this.ungroupedStageIds());
      if (ungrouped.has(stageId)) {
        ungrouped.delete(stageId);
      } else {
        ungrouped.add(stageId);
      }
      this.ungroupedStageIds.set(ungrouped);
    } else {
      // When global is OFF, toggle the per-stage set
      const current = new Set(this.groupedStageIds());
      if (current.has(stageId)) {
        current.delete(stageId);
      } else {
        current.add(stageId);
      }
      this.groupedStageIds.set(current);
    }

    const expanded = new Set(this.expandedGroupIds());
    for (const id of expanded) {
      if (id.includes(stageId)) expanded.delete(id);
    }
    this.expandedGroupIds.set(expanded);
  }

  // --- Stage filter popover ---

  toggleFilterPopover(stageId: string, event: Event): void {
    event.stopPropagation();
    this.visibilityPopoverStageId.set(null);
    this.filterPopoverStageId.set(this.filterPopoverStageId() === stageId ? null : stageId);
  }

  closeFilterPopover(): void {
    this.filterPopoverStageId.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.filterPopoverStageId()) {
      this.filterPopoverStageId.set(null);
    }
    if (this.visibilityPopoverStageId()) {
      this.visibilityPopoverStageId.set(null);
    }
  }

  getStageFilterOptions(stage: BpmsVisualFlowStage): { units: Array<{ id: string; label: string }>; profiles: Array<{ id: string; label: string }> } {
    const profiles = stage.profiles ?? [];
    const unitMap = new Map<string, string>();
    const profileMap = new Map<string, string>();
    for (const p of profiles) {
      const unitId = p.unit_profile?.unit_id ?? '';
      const unitLabel = p.unit_profile?.unit?.acronym ?? '';
      if (unitId && unitLabel) unitMap.set(unitId, unitLabel);
      const profId = p.unit_profile?.profile_id ?? '';
      const profLabel = p.unit_profile?.profile?.name ?? '';
      if (profId && profLabel) profileMap.set(profId, profLabel);
    }
    return {
      units: Array.from(unitMap.entries()).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label)),
      profiles: Array.from(profileMap.entries()).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label)),
    };
  }

  toggleStageFilterUnit(stageId: string, unitId: string): void {
    const filters = new Map(this.stageFilters());
    const current = filters.get(stageId) ?? { unitIds: new Set<string>(), profileIds: new Set<string>() };
    const unitIds = new Set(current.unitIds);
    if (unitIds.has(unitId)) unitIds.delete(unitId); else unitIds.add(unitId);
    filters.set(stageId, { ...current, unitIds });
    this.stageFilters.set(filters);
  }

  toggleStageFilterProfile(stageId: string, profileId: string): void {
    const filters = new Map(this.stageFilters());
    const current = filters.get(stageId) ?? { unitIds: new Set<string>(), profileIds: new Set<string>() };
    const profileIds = new Set(current.profileIds);
    if (profileIds.has(profileId)) profileIds.delete(profileId); else profileIds.add(profileId);
    filters.set(stageId, { ...current, profileIds });
    this.stageFilters.set(filters);
  }

  isStageFilterUnitActive(stageId: string, unitId: string): boolean {
    return this.stageFilters().get(stageId)?.unitIds.has(unitId) ?? false;
  }

  isStageFilterProfileActive(stageId: string, profileId: string): boolean {
    return this.stageFilters().get(stageId)?.profileIds.has(profileId) ?? false;
  }

  hasStageFilter(stageId: string): boolean {
    const f = this.stageFilters().get(stageId);
    if (!f) return false;
    return f.unitIds.size > 0 || f.profileIds.size > 0;
  }

  clearStageFilter(stageId: string): void {
    const filters = new Map(this.stageFilters());
    filters.delete(stageId);
    this.stageFilters.set(filters);
  }

  // --- Hide/Show profiles ---

  hideProfile(profileId: string): void {
    const updated = new Set(this.hiddenProfileIds());
    updated.add(profileId);
    this.hiddenProfileIds.set(updated);
  }

  showAllHidden(stageId: string): void {
    const stage = this.stages().find((s) => s.id === stageId);
    if (!stage) return;
    const stageProfileIds = new Set((stage.profiles ?? []).map((p) => p.id));
    const updated = new Set(this.hiddenProfileIds());
    for (const id of stageProfileIds) updated.delete(id);
    this.hiddenProfileIds.set(updated);
  }

  getHiddenCount(stageId: string): number {
    const stage = this.stages().find((s) => s.id === stageId);
    if (!stage) return 0;
    const hidden = this.hiddenProfileIds();
    return (stage.profiles ?? []).filter((p) => hidden.has(p.id)).length;
  }

  // --- Visibility popover ---

  toggleVisibilityPopover(stageId: string, event: Event): void {
    event.stopPropagation();
    this.filterPopoverStageId.set(null);
    this.visibilityPopoverStageId.set(this.visibilityPopoverStageId() === stageId ? null : stageId);
  }

  toggleProfileVisibility(profileId: string): void {
    const updated = new Set(this.hiddenProfileIds());
    if (updated.has(profileId)) {
      updated.delete(profileId);
    } else {
      updated.add(profileId);
    }
    this.hiddenProfileIds.set(updated);
  }

  getStageProfileList(stageId: string): Array<{ id: string; profileName: string; unitAcronym: string; isHidden: boolean }> {
    const stage = this.stages().find((s) => s.id === stageId);
    if (!stage) return [];
    const hidden = this.hiddenProfileIds();
    return (stage.profiles ?? []).map((p) => ({
      id: p.id,
      profileName: p.unit_profile?.profile?.name ?? 'Perfil',
      unitAcronym: p.unit_profile?.unit?.acronym ?? '',
      isHidden: hidden.has(p.id),
    }));
  }

  toggleGlobalGrouping(): void {
    this.globalGrouping.update((v) => !v);
    // Clear expanded groups when toggling global
    this.expandedGroupIds.set(new Set());
  }

  expandGroup(groupId: string, event: MouseEvent): void {
    event.stopPropagation();
    const updated = new Set(this.expandedGroupIds());
    updated.add(groupId);
    this.expandedGroupIds.set(updated);
  }

  collapseGroup(groupId: string, event: MouseEvent): void {
    event.stopPropagation();
    const updated = new Set(this.expandedGroupIds());
    updated.delete(groupId);
    this.expandedGroupIds.set(updated);
  }

  /** Display items per stage: either individual profiles or grouped cards. */
  getDisplayItems(stage: { id: string; order_index: number; visibleProfiles: BpmsVisualFlowStageProfile[]; step_catalog?: { name?: string; permissions?: unknown } }): DisplayItem[] {
    if (!this.isStageGrouped(stage.id)) {
      return stage.visibleProfiles.map((p) => ({
        type: 'individual' as const,
        id: p.id,
        label: p.unit_profile?.profile?.name ?? 'Perfil',
        sublabel: this.getUnitHierarchyLabel(p),
        memberIds: [p.id],
        profile: p,
        count: 1,
        sectorCount: 0,
      }));
    }

    // Group by profile_id (type of profile)
    const groups = new Map<string, { profileName: string; members: BpmsVisualFlowStageProfile[] }>();
    for (const p of stage.visibleProfiles) {
      const profileId = p.unit_profile?.profile_id ?? p.id;
      const existing = groups.get(profileId);
      if (existing) {
        existing.members.push(p);
      } else {
        groups.set(profileId, {
          profileName: p.unit_profile?.profile?.name ?? 'Perfil',
          members: [p],
        });
      }
    }

    const expanded = this.expandedGroupIds();
    const items: DisplayItem[] = [];

    for (const [profileId, group] of groups) {
      const groupId = `group_${stage.id}_${profileId}`;
      if (expanded.has(groupId)) {
        // Expanded: show individual cards
        for (const p of group.members) {
          items.push({
            type: 'individual',
            id: p.id,
            label: p.unit_profile?.profile?.name ?? 'Perfil',
            sublabel: this.getUnitHierarchyLabel(p),
            memberIds: [p.id],
            profile: p,
            count: 1,
            sectorCount: 0,
            groupId,
          });
        }
      } else if (group.members.length < 2) {
        // Single member: show as individual (no group card)
        const p = group.members[0];
        items.push({
          type: 'individual',
          id: p.id,
          label: p.unit_profile?.profile?.name ?? 'Perfil',
          sublabel: this.getUnitHierarchyLabel(p),
          memberIds: [p.id],
          profile: p,
          count: 1,
          sectorCount: 0,
        });
      } else {
        const distinctUnits = new Set(group.members.map((m) => m.unit_profile?.unit_id).filter(Boolean));
        items.push({
          type: 'group',
          id: groupId,
          label: group.profileName,
          sublabel: '',
          memberIds: group.members.map((m) => m.id),
          profile: undefined,
          count: group.members.length,
          sectorCount: distinctUnits.size,
        });
      }
    }

    return items;
  }

  /** Map from real profile ID → display item ID (for connection routing). */
  private readonly profileToDisplayId = computed(() => {
    const map = new Map<string, string>();
    for (const stage of this.filteredStages()) {
      const items = this.getDisplayItems(stage);
      for (const item of items) {
        for (const memberId of item.memberIds) {
          map.set(memberId, item.id);
        }
      }
    }
    return map;
  });

  /** Get the display ID for a real profile ID. */
  getDisplayId(profileId: string): string {
    return this.profileToDisplayId().get(profileId) ?? profileId;
  }

  /** Grouped connection paths: remap connections through display IDs and deduplicate. */
  readonly groupedConnectionPaths = computed(() => {
    const displayMap = this.profileToDisplayId();
    const conns = this.filteredConnections();

    // Remap and deduplicate
    const seen = new Set<string>();
    const remapped: Array<{ id: string; sourceDisplayId: string; targetDisplayId: string; type: ConnectionType; tooltip: string }> = [];

    for (const c of conns) {
      const srcDisplay = displayMap.get(c.source_stage_profile_id) ?? c.source_stage_profile_id;
      const tgtDisplay = displayMap.get(c.target_stage_profile_id) ?? c.target_stage_profile_id;
      const key = `${srcDisplay}→${tgtDisplay}`;
      if (seen.has(key)) continue;
      seen.add(key);
      remapped.push({
        id: c.id,
        sourceDisplayId: srcDisplay,
        targetDisplayId: tgtDisplay,
        type: c.connection_type,
        tooltip: this.buildConnectionTooltip(c),
      });
    }

    // Build paths using display item positions
    const laneMap = this.allocateDisplayLanes(remapped);
    const spreadMap = this.allocateDisplaySpreadOffsets(remapped);
    return remapped
      .map((r) => this.buildDisplayConnectionPath(r, laneMap.get(r.id) ?? 0, spreadMap.get(r.id) ?? 0))
      .filter(Boolean) as ConnectionPath[];
  });

  /** Get connector position for a display item (individual or group). */
  private getDisplayConnectorPos(displayId: string, side: 'right-out' | 'right-in' | 'left-out' | 'left-in'): ConnectorPos | null {
    for (const stage of this.filteredStages()) {
      const items = this.getDisplayItems(stage);
      const idx = items.findIndex((item) => item.id === displayId);
      if (idx >= 0) {
        const cardX = getCardX(stage.order_index);
        const y = getProfileY(idx);
        const topY = y + CARD_HEIGHT / 2 - 18;
        const botY = y + CARD_HEIGHT / 2 + 18;
        switch (side) {
          case 'right-out': return { x: cardX + CARD_WIDTH, y: topY };
          case 'right-in':  return { x: cardX + CARD_WIDTH, y: botY };
          case 'left-in':   return { x: cardX, y: topY };
          case 'left-out':  return { x: cardX, y: botY };
        }
      }
    }
    return null;
  }

  private getDisplayStageX(displayId: string): number {
    for (const stage of this.filteredStages()) {
      const items = this.getDisplayItems(stage);
      if (items.some((item) => item.id === displayId)) {
        return getStageX(stage.order_index);
      }
    }
    return 0;
  }

  private getDisplayMemberIds(displayId: string): string[] {
    for (const stage of this.filteredStages()) {
      const item = this.getDisplayItems(stage).find((i) => i.id === displayId);
      if (item) return item.memberIds;
    }
    return [];
  }

  private buildDisplayConnectionPath(
    r: { id: string; sourceDisplayId: string; targetDisplayId: string; type: ConnectionType; tooltip: string },
    laneOffset: number,
    spreadOffset = 0,
  ): ConnectionPath | null {
    let sourceSide: 'right-out' | 'left-out';
    let targetSide: 'right-in' | 'left-in';

    // Determine if same stage (intra)
    const srcStageX = this.getDisplayStageX(r.sourceDisplayId);
    const tgtStageX = this.getDisplayStageX(r.targetDisplayId);
    const isSameStage = srcStageX === tgtStageX;
    const isSelf = r.sourceDisplayId === r.targetDisplayId;

    let effectiveType = r.type;
    if (isSelf) effectiveType = 'AUTO_REFERENCIA';
    else if (isSameStage) effectiveType = 'INTRA_ETAPA';

    switch (effectiveType) {
      case 'AVANCO': sourceSide = 'right-out'; targetSide = 'left-in'; break;
      case 'RETORNO': sourceSide = 'left-out'; targetSide = 'right-in'; break;
      default: sourceSide = 'right-out'; targetSide = 'right-in'; break;
    }

    const sourcePos = this.getDisplayConnectorPos(r.sourceDisplayId, sourceSide);
    const targetPos = this.getDisplayConnectorPos(r.targetDisplayId, targetSide);
    if (!sourcePos || !targetPos) return null;

    // Resolve member profile IDs for highlight
    const srcIds = this.getDisplayMemberIds(r.sourceDisplayId);
    const tgtIds = this.getDisplayMemberIds(r.targetDisplayId);

    const cr = 8;
    const stub = 20;
    let d: string;

    if (isSelf) {
      const cardX = sourcePos.x;
      const cardY = sourcePos.y;
      const botY = targetPos.y;
      const offset = 25;
      d = [
        `M ${cardX} ${cardY}`,
        `H ${cardX + offset}`,
        `V ${botY}`,
        `H ${cardX}`
      ].join(' ');
      return { id: r.id, d, type: effectiveType, markerX: targetPos.x, markerY: targetPos.y, markerAngle: 180, tooltip: r.tooltip, sourceProfileIds: srcIds, targetProfileIds: tgtIds };
    }

    if (isSameStage) {
      const rx = sourcePos.x + 20 + laneOffset;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, rx, cr, 'right');
      return { id: r.id, d, type: effectiveType, markerX: targetPos.x, markerY: targetPos.y, markerAngle: 180, tooltip: r.tooltip, sourceProfileIds: srcIds, targetProfileIds: tgtIds };
    }

    if (effectiveType === 'RETORNO') {
      const midX = srcStageX + CARD_MARGIN - 15 - laneOffset;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, midX, cr, 'left', spreadOffset);
    } else {
      const midX = srcStageX + CARD_MARGIN + CARD_WIDTH + 10 + laneOffset;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, midX, cr, 'right', spreadOffset);
    }

    return { id: r.id, d, type: effectiveType, markerX: targetPos.x, markerY: targetPos.y, markerAngle: 0, tooltip: r.tooltip, sourceProfileIds: srcIds, targetProfileIds: tgtIds };
  }

  private allocateDisplayLanes(items: Array<{ id: string; sourceDisplayId: string; targetDisplayId: string; type: ConnectionType }>): Map<string, number> {
    const result = new Map<string, number>();
    const groups = new Map<string, string[]>();

    for (const item of items) {
      const srcStageX = this.getDisplayStageX(item.sourceDisplayId);
      const tgtStageX = this.getDisplayStageX(item.targetDisplayId);
      const isSelf = item.sourceDisplayId === item.targetDisplayId;
      if (isSelf) { result.set(item.id, 0); continue; }
      let key: string;
      if (srcStageX === tgtStageX) {
        key = `intra_${srcStageX}`;
      } else if (item.type === 'RETORNO') {
        key = `left_${srcStageX}`;
      } else {
        key = `right_${srcStageX}`;
      }
      const group = groups.get(key) ?? [];
      group.push(item.id);
      groups.set(key, group);
    }

    const laneSpacing = 7;
    for (const [, ids] of groups) {
      for (let i = 0; i < ids.length; i++) {
        result.set(ids[i], i * laneSpacing);
      }
    }
    return result;
  }

  /** Check if any stage has grouping active (for deciding which connection paths to use). */
  readonly hasAnyGrouping = computed(() => {
    const globalOn = this.globalGrouping() || this.externalGlobalGrouping();
    if (globalOn) {
      // Global is on but some stages may be ungrouped as exceptions
      const stages = this.filteredStages();
      const ungrouped = this.ungroupedStageIds();
      return stages.some((s) => !ungrouped.has(s.id));
    }
    return this.groupedStageIds().size > 0;
  });

  /** Map of grouped connection path ID → source/target display IDs (for removal). */
  readonly groupedConnectionMap = computed(() => {
    const displayMap = this.profileToDisplayId();
    const conns = this.filteredConnections();
    const map = new Map<string, { sourceDisplayId: string; targetDisplayId: string }>();
    const seen = new Set<string>();

    for (const c of conns) {
      const srcDisplay = displayMap.get(c.source_stage_profile_id) ?? c.source_stage_profile_id;
      const tgtDisplay = displayMap.get(c.target_stage_profile_id) ?? c.target_stage_profile_id;
      const key = `${srcDisplay}→${tgtDisplay}`;
      if (seen.has(key)) continue;
      seen.add(key);
      map.set(c.id, { sourceDisplayId: srcDisplay, targetDisplayId: tgtDisplay });
    }
    return map;
  });

  getStageX = getStageX;
  getCardX = getCardX;
  getProfileY = getProfileY;

  isConnectionTypeVisible(type: string): boolean {
    const v = this.connectionTypeVisibility();
    return v[type as keyof ConnectionTypeVisibility] !== false;
  }

  isAutoLinkVisible(): boolean {
    return this.connectionTypeVisibility().AUTO_LINK !== false;
  }

  getHeaderX(orderIndex: number): number {
    return getStageX(orderIndex) + (STAGE_COLUMN_WIDTH - Math.round(STAGE_COLUMN_WIDTH * 0.8)) / 2;
  }
  readonly CANVAS_PADDING = CANVAS_PADDING;
  readonly STAGE_COLUMN_WIDTH = STAGE_COLUMN_WIDTH;
  readonly CARD_WIDTH = CARD_WIDTH;
  readonly HEADER_WIDTH = Math.round(STAGE_COLUMN_WIDTH * 0.8);

  isProfileVisible(profile: BpmsVisualFlowStageProfile): boolean {
    return this.visibleProfileIds().has(profile.id);
  }

  private matchesStageFilter(profile: BpmsVisualFlowStageProfile, f: { unitIds: Set<string>; profileIds: Set<string> }): boolean {
    const unitId = profile.unit_profile?.unit_id ?? '';
    const profileId = profile.unit_profile?.profile_id ?? '';
    const matchesUnit = f.unitIds.size === 0 || f.unitIds.has(unitId);
    const matchesProfile = f.profileIds.size === 0 || f.profileIds.has(profileId);
    return matchesUnit && matchesProfile;
  }

  getUnitHierarchyLabel(profile: BpmsVisualFlowStageProfile): string {
    const unit = profile.unit_profile?.unit;
    if (!unit) return '';
    const acronym = unit.acronym;
    if (!unit.parent_id) return acronym;
    const parent = this.orgUnits().find((u) => u.id === unit.parent_id);
    if (!parent) return acronym;
    return `${parent.acronym} / ${acronym}`;
  }

  getConnectionCount(stage: BpmsVisualFlowStage): number {
    const profileIds = new Set((stage.profiles ?? []).map((p) => p.id));
    return this.connections().filter(
      (c) => profileIds.has(c.source_stage_profile_id) || profileIds.has(c.target_stage_profile_id),
    ).length;
  }

  onStageHeaderClick(stage: BpmsVisualFlowStage): void {
    this.stageSelected.emit(stage);
  }

  onCanvasScroll(): void {
    if (!this.canvasContainer) return;
    const st = this.canvasContainer.nativeElement.scrollTop;
    const zoom = this.zoomLevel();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const headers = this.canvasContainer!.nativeElement.querySelectorAll('.stage-header');
      const adjustedSt = st / zoom;
      for (const el of Array.from(headers)) {
        (el as HTMLElement).style.transform = `translateY(${adjustedSt}px)`;
      }
    });
  }

  onCanvasMouseDown(event: MouseEvent): void {
    // Right-click (button 2) starts panning
    if (event.button === 2 && this.canvasContainer) {
      event.preventDefault();
      event.stopPropagation();
      this.panning = true;
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.panScrollStartX = this.canvasContainer.nativeElement.scrollLeft;
      this.panScrollStartY = this.canvasContainer.nativeElement.scrollTop;
      this.canvasContainer.nativeElement.style.cursor = 'grabbing';
    }
  }

  onCanvasContextMenu(event: MouseEvent): void {
    // Prevent native context menu on the canvas background
    if (!(event.target as HTMLElement).closest('.profile-card')) {
      event.preventDefault();
    }
  }

  onCanvasWheel(event: WheelEvent): void {
    if (!event.shiftKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -FlowCanvasComponent.ZOOM_STEP : FlowCanvasComponent.ZOOM_STEP;
    const newZoom = Math.min(FlowCanvasComponent.ZOOM_MAX, Math.max(FlowCanvasComponent.ZOOM_MIN, this.zoomLevel() + delta));
    this.zoomLevel.set(Math.round(newZoom * 100) / 100);
  }

  onAddProfileClick(stage: BpmsVisualFlowStage, event: MouseEvent): void {
    event.stopPropagation();
    this.openProfileDialog.emit(stage);
  }

  onProfileRightClick(profile: BpmsVisualFlowStageProfile, stage: BpmsVisualFlowStage, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.profileContextMenu.emit({ x: event.clientX, y: event.clientY, profile, stage });
  }

  onCardMouseEnter(profileId: string): void {
    if (!this.dragging() && !this.reorderDragging()) {
      this.hoveredProfileId.set(profileId);
      this.hoveredConnectionProfileIds.set(null);
    }
  }

  showTooltip(text: string, event: MouseEvent): void {
    this.tooltipText.set(text);
    this.tooltipPos.set({ x: event.clientX, y: event.clientY });
  }

  hideTooltip(): void {
    this.tooltipText.set(null);
    this.tooltipPos.set(null);
  }

  onConnectorInMouseEnter(profileId: string, event: MouseEvent): void {
    if (this.dragging()) {
      this.dragHoverTargetId.set(profileId);
      this.dragHoverPos.set({ x: event.clientX, y: event.clientY });
    }
  }

  onConnectorInMouseLeave(): void {
    this.dragHoverTargetId.set(null);
    this.dragHoverGroupMemberIds.set([]);
    this.dragHoverPos.set(null);
  }

  onGroupConnectorInMouseEnter(memberIds: string[], event: MouseEvent): void {
    if (this.dragging() && memberIds.length > 0) {
      this.dragHoverGroupMemberIds.set(memberIds);
      this.dragHoverPos.set({ x: event.clientX, y: event.clientY });
    }
  }

  onGroupConnectorInMouseLeave(): void {
    this.dragHoverGroupMemberIds.set([]);
    this.dragHoverPos.set(null);
  }

  onGroupMouseEnter(memberIds: string[]): void {
    if (!this.dragging() && !this.reorderDragging() && memberIds.length > 0) {
      this.hoveredProfileId.set(memberIds[0]);
    }
  }

  onCardMouseLeave(): void {
    this.hoveredProfileId.set(null);
    this.hoveredConnectionProfileIds.set(null);
  }

  onConnectionMouseEnter(sourceProfileIds: string[], targetProfileIds: string[]): void {
    this.hoveredProfileId.set(null);
    this.hoveredConnectionProfileIds.set(new Set([...sourceProfileIds, ...targetProfileIds]));
  }

  onConnectionMouseLeave(): void {
    this.hoveredConnectionProfileIds.set(null);
  }

  hasAnyHover(): boolean {
    return this.hoveredProfileId() !== null || this.hoveredConnectionProfileIds() !== null;
  }

  onGroupConnectorMouseDown(displayId: string, memberIds: string[], side: 'right-out' | 'left-out', event: MouseEvent): void {
    if (memberIds.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(true);
    this.dragSourceId.set(memberIds[0]); // for hover hint resolution
    this.dragSourceMemberIds.set(memberIds);
    this.dragSourceSide.set(side);
    const pos = this.getDisplayConnectorPos(displayId, side);
    if (pos) {
      this.dragLine.set({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    }
  }

  onGroupConnectorMouseUp(memberIds: string[], event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const sourceMembers = this.dragSourceMemberIds();
    if (sourceMembers.length === 0) return;

    this.groupConnectionCreated.emit({
      sourceGroupMemberIds: sourceMembers,
      targetGroupMemberIds: memberIds,
    });

    this.stopAutoScroll();
    this.dragging.set(false);
    this.dragLine.set(null);
    this.dragSourceId.set(null);
    this.dragSourceMemberIds.set([]);
    this.dragSourceSide.set(null);
    this.dragHoverTargetId.set(null);
    this.dragHoverGroupMemberIds.set([]);
    this.dragHoverPos.set(null);
  }

  private getUnitIdForProfile(profileId: string): string | null {
    for (const stage of this.stages()) {
      for (const p of stage.profiles ?? []) {
        if (p.id === profileId) return p.unit_profile?.unit_id ?? null;
      }
    }
    return null;
  }

  isCardHighlighted(profileId: string): boolean {
    const set = this.highlightedProfileIds();
    return !set || set.has(profileId);
  }

  isConnectionHighlighted(conn: BpmsVisualFlowConnection): boolean {
    const hovered = this.hoveredProfileId();
    if (!hovered) return true;
    return conn.source_stage_profile_id === hovered || conn.target_stage_profile_id === hovered;
  }

  isConnectionPathHighlighted(pathId: string): boolean {
    const connHover = this.hoveredConnectionProfileIds();
    const hovered = this.hoveredProfileId();
    if (!connHover && !hovered) return true;

    const conn = this.connections().find((c) => c.id === pathId);
    if (!conn) return true;

    if (connHover) {
      return connHover.has(conn.source_stage_profile_id) && connHover.has(conn.target_stage_profile_id);
    }

    return conn.source_stage_profile_id === hovered || conn.target_stage_profile_id === hovered;
  }

  // --- Drag-to-reorder ---

  onCardMouseDown(profileId: string, stageId: string, event: MouseEvent): void {
    // Only start reorder on left-click on the card content (not connectors)
    if (event.button !== 0) return;
    event.preventDefault();
    this.reorderDragging.set(true);
    this.reorderProfileId.set(profileId);
    this.reorderStageId.set(stageId);
    this.reorderStartY = event.clientY;
    this.reorderGhostY.set(0);
  }

  private handleReorderMove(event: MouseEvent): void {
    if (!this.reorderDragging()) return;
    const deltaY = event.clientY - this.reorderStartY;
    this.reorderGhostY.set(deltaY);
  }

  private handleReorderEnd(): void {
    if (!this.reorderDragging()) return;
    const profileId = this.reorderProfileId();
    const stageId = this.reorderStageId();
    const deltaY = this.reorderGhostY();

    if (profileId && stageId && Math.abs(deltaY) > CARD_HEIGHT / 2) {
      // Calculate how many positions to move
      const positions = Math.round(deltaY / (CARD_HEIGHT + CARD_GAP));
      if (positions !== 0) {
        const stage = this.filteredStages().find((s) => s.id === stageId);
        if (stage) {
          const currentIndex = stage.visibleProfiles.findIndex((p) => p.id === profileId);
          const newIndex = Math.max(0, Math.min(stage.visibleProfiles.length - 1, currentIndex + positions));
          if (newIndex !== currentIndex) {
            this.profileReordered.emit({ stageId, profileId, newIndex });
          }
        }
      }
    }

    this.reorderDragging.set(false);
    this.reorderProfileId.set(null);
    this.reorderStageId.set(null);
    this.reorderGhostY.set(0);
  }

  onConnectionClick(connId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.hasAnyGrouping()) {
      // Find the grouped connection to get source/target display IDs
      const groupedConn = this.groupedConnectionMap().get(connId);
      if (groupedConn) {
        this.groupConnectionRemoved.emit({
          sourceDisplayId: groupedConn.sourceDisplayId,
          targetDisplayId: groupedConn.targetDisplayId,
        });
        return;
      }
    }
    this.connectionRemoved.emit(connId);
  }

  // --- Drag-to-connect ---

  onConnectorMouseDown(profileId: string, side: 'right-out' | 'left-out', event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(true);
    this.dragSourceId.set(profileId);
    this.dragSourceMemberIds.set([profileId]);
    this.dragSourceSide.set(side);
    // Use display position when grouping is active (profileId may differ from display index)
    const displayId = this.getDisplayId(profileId);
    const pos = this.getDisplayConnectorPos(displayId, side) ?? this.getConnectorPos(profileId, side);
    if (pos) {
      this.dragLine.set({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.panning && this.canvasContainer) {
      const dx = event.clientX - this.panStartX;
      const dy = event.clientY - this.panStartY;
      this.canvasContainer.nativeElement.scrollLeft = this.panScrollStartX - dx;
      this.canvasContainer.nativeElement.scrollTop = this.panScrollStartY - dy;
      return;
    }
    if (this.reorderDragging()) {
      this.handleReorderMove(event);
      return;
    }
    if (!this.dragging() || !this.canvasContainer) return;
    this.lastMouseClientX = event.clientX;
    this.lastMouseClientY = event.clientY;
    this.updateDragLineFromClient(event.clientX, event.clientY);
    this.updateAutoScroll(event.clientX, event.clientY);
  }

  private updateDragLineFromClient(clientX: number, clientY: number): void {
    if (!this.canvasContainer) return;
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const zoom = this.zoomLevel();
    const x = (clientX - rect.left + this.canvasContainer.nativeElement.scrollLeft) / zoom;
    const y = (clientY - rect.top + this.canvasContainer.nativeElement.scrollTop) / zoom;
    this.dragLine.update((line) => line ? { ...line, x2: x, y2: y } : null);
  }

  private updateAutoScroll(clientX: number, clientY: number): void {
    if (!this.canvasContainer) return;
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const edge = FlowCanvasComponent.AUTO_SCROLL_EDGE;

    let dx = 0;
    let dy = 0;
    if (clientX < rect.left + edge) dx = -FlowCanvasComponent.AUTO_SCROLL_SPEED;
    else if (clientX > rect.right - edge) dx = FlowCanvasComponent.AUTO_SCROLL_SPEED;
    if (clientY < rect.top + edge) dy = -FlowCanvasComponent.AUTO_SCROLL_SPEED;
    else if (clientY > rect.bottom - edge) dy = FlowCanvasComponent.AUTO_SCROLL_SPEED;

    this.autoScrollDx = dx;
    this.autoScrollDy = dy;

    if ((dx !== 0 || dy !== 0) && !this.autoScrollRAF) {
      this.runAutoScroll();
    } else if (dx === 0 && dy === 0 && this.autoScrollRAF) {
      cancelAnimationFrame(this.autoScrollRAF);
      this.autoScrollRAF = 0;
    }
  }

  private runAutoScroll(): void {
    this.autoScrollRAF = requestAnimationFrame(() => {
      if (!this.dragging() || !this.canvasContainer) {
        this.autoScrollRAF = 0;
        return;
      }
      const el = this.canvasContainer.nativeElement;
      el.scrollLeft += this.autoScrollDx;
      el.scrollTop += this.autoScrollDy;
      this.updateDragLineFromClient(this.lastMouseClientX, this.lastMouseClientY);

      if (this.autoScrollDx !== 0 || this.autoScrollDy !== 0) {
        this.runAutoScroll();
      } else {
        this.autoScrollRAF = 0;
      }
    });
  }

  private stopAutoScroll(): void {
    if (this.autoScrollRAF) {
      cancelAnimationFrame(this.autoScrollRAF);
      this.autoScrollRAF = 0;
    }
    this.autoScrollDx = 0;
    this.autoScrollDy = 0;
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(_event: MouseEvent): void {
    if (this.panning) {
      this.panning = false;
      if (this.canvasContainer) {
        this.canvasContainer.nativeElement.style.cursor = '';
      }
      return;
    }
    if (this.reorderDragging()) {
      this.handleReorderEnd();
      return;
    }
    this.stopAutoScroll();
    this.dragging.set(false);
    this.dragLine.set(null);
    this.dragSourceId.set(null);
    this.dragSourceMemberIds.set([]);
    this.dragSourceSide.set(null);
    this.dragHoverTargetId.set(null);
    this.dragHoverGroupMemberIds.set([]);
    this.dragHoverPos.set(null);
  }

  onConnectorMouseUp(profileId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const sourceMembers = this.dragSourceMemberIds();
    if (sourceMembers.length === 0) return;

    if (sourceMembers.length > 1) {
      // Source is a group — delegate to builder via event
      this.groupConnectionCreated.emit({
        sourceGroupMemberIds: sourceMembers,
        targetGroupMemberIds: [profileId],
      });
    } else {
      this.connectionCreated.emit({ sourceStageProfileId: sourceMembers[0], targetStageProfileId: profileId });
    }

    this.stopAutoScroll();
    this.dragging.set(false);
    this.dragLine.set(null);
    this.dragSourceId.set(null);
    this.dragSourceMemberIds.set([]);
    this.dragSourceSide.set(null);
    this.dragHoverTargetId.set(null);
    this.dragHoverGroupMemberIds.set([]);
    this.dragHoverPos.set(null);
  }

  // --- Positioning helpers ---

  private getConnectorPos(profileId: string, side: 'right-out' | 'right-in' | 'left-out' | 'left-in'): ConnectorPos | null {
    for (const stage of this.filteredStages()) {
      const idx = stage.visibleProfiles.findIndex((p) => p.id === profileId);
      if (idx >= 0) {
        const cardX = getCardX(stage.order_index);
        const y = getProfileY(idx);
        const topY = y + CARD_HEIGHT / 2 - 18;
        const botY = y + CARD_HEIGHT / 2 + 18;
        switch (side) {
          case 'right-out': return { x: cardX + CARD_WIDTH, y: topY };
          case 'right-in':  return { x: cardX + CARD_WIDTH, y: botY };
          case 'left-in':   return { x: cardX, y: topY };
          case 'left-out':  return { x: cardX, y: botY };
        }
      }
    }
    return null;
  }

  private buildConnectionPath(conn: BpmsVisualFlowConnection, laneOffset: number, spreadOffset = 0): ConnectionPath | null {
    let sourceSide: 'right-out' | 'left-out';
    let targetSide: 'right-in' | 'left-in';

    switch (conn.connection_type) {
      case 'AVANCO':
        sourceSide = 'right-out';
        targetSide = 'left-in';
        break;
      case 'RETORNO':
        sourceSide = 'left-out';
        targetSide = 'right-in';
        break;
      case 'INTRA_ETAPA':
      case 'AUTO_REFERENCIA':
        sourceSide = 'right-out';
        targetSide = 'right-in';
        break;
    }

    const sourcePos = this.getConnectorPos(conn.source_stage_profile_id, sourceSide);
    const targetPos = this.getConnectorPos(conn.target_stage_profile_id, targetSide);
    if (!sourcePos || !targetPos) return null;

    const tooltip = this.buildConnectionTooltip(conn);
    const r = 8; // corner radius
    const stub = 20;
    let d: string;
    const srcIds = [conn.source_stage_profile_id];
    const tgtIds = [conn.target_stage_profile_id];

    if (conn.connection_type === 'AUTO_REFERENCIA') {
      const rx = sourcePos.x + stub;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, rx, r, 'right');
      return { id: conn.id, d, type: conn.connection_type, markerX: targetPos.x, markerY: targetPos.y, markerAngle: 180, tooltip, sourceProfileIds: srcIds, targetProfileIds: tgtIds };
    }

    if (conn.connection_type === 'INTRA_ETAPA') {
      const rx = sourcePos.x + 20 + laneOffset;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, rx, r, 'right');
      return { id: conn.id, d, type: conn.connection_type, markerX: targetPos.x, markerY: targetPos.y, markerAngle: 180, tooltip, sourceProfileIds: srcIds, targetProfileIds: tgtIds };
    }

    if (conn.connection_type === 'RETORNO') {
      const sourceStageX = this.getStageXForProfile(conn.source_stage_profile_id);
      const midX = sourceStageX + CARD_MARGIN - 15 - laneOffset;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, midX, r, 'left', spreadOffset);
    } else {
      const sourceStageX = this.getStageXForProfile(conn.source_stage_profile_id);
      const midX = sourceStageX + CARD_MARGIN + CARD_WIDTH + 10 + laneOffset;
      d = this.buildRoundedOrthogonal(sourcePos, targetPos, midX, r, 'right', spreadOffset);
    }

    return { id: conn.id, d, type: conn.connection_type, markerX: targetPos.x, markerY: targetPos.y, markerAngle: 0, tooltip, sourceProfileIds: srcIds, targetProfileIds: tgtIds };
  }

  private getStageXForProfile(profileId: string): number {
    for (const stage of this.filteredStages()) {
      if (stage.visibleProfiles.some((p) => p.id === profileId)) {
        return getStageX(stage.order_index);
      }
    }
    return 0;
  }

  private buildConnectionTooltip(conn: BpmsVisualFlowConnection): string {
    const stages = this.stages();
    let sourceName = '';
    let targetName = '';
    let targetStageName = '';
    let sourceOrderIndex = -1;
    let targetOrderIndex = -1;

    for (const stage of stages) {
      for (const p of stage.profiles ?? []) {
        if (p.id === conn.source_stage_profile_id) {
          sourceName = p.unit_profile?.profile?.name ?? 'Perfil';
          sourceOrderIndex = stage.order_index;
        }
        if (p.id === conn.target_stage_profile_id) {
          targetName = p.unit_profile?.profile?.name ?? 'Perfil';
          targetStageName = stage.step_catalog?.name ?? 'Etapa';
          targetOrderIndex = stage.order_index;
        }
      }
    }

    if (!sourceName || !targetName) return '';

    const tplName = this.templateName() || 'Documento';
    let verb: string;
    let targetLabel: string;

    if (conn.source_stage_profile_id === conn.target_stage_profile_id) {
      verb = 'repassa';
      targetLabel = `${tplName} para\n${targetStageName} de Outro ${targetName}`;
    } else if (sourceOrderIndex === targetOrderIndex) {
      verb = 'repassa';
      targetLabel = `${tplName} para\n${targetStageName} de ${targetName}`;
    } else if (sourceOrderIndex < targetOrderIndex) {
      verb = 'envia';
      targetLabel = `${tplName} para\n${targetStageName} de ${targetName}`;
    } else {
      verb = 'devolve';
      targetLabel = `${tplName} para\n${targetStageName} de ${targetName}`;
    }

    return `${sourceName} ${verb}\n${targetLabel}`;
  }

  /**
   * Allocates lane offsets so vertical segments of connections sharing the same routing zone don't overlap.
   * Returns a map of connectionId → lane offset in pixels (can be negative or positive).
   */
  private allocateLanes(conns: BpmsVisualFlowConnection[]): Map<string, number> {
    const result = new Map<string, number>();
    // Group connections by their routing zone key (source stage order_index + direction)
    const groups = new Map<string, Array<{ id: string; srcY: number; tgtY: number }>>();

    for (const conn of conns) {
      if (conn.connection_type === 'AUTO_REFERENCIA') {
        result.set(conn.id, 0);
        continue;
      }
      const stageX = this.getStageXForProfile(conn.source_stage_profile_id);
      let key: string;
      if (conn.connection_type === 'INTRA_ETAPA') {
        key = `intra_${stageX}`;
      } else if (conn.connection_type === 'RETORNO') {
        key = `left_${stageX}`;
      } else {
        key = `right_${stageX}`;
      }

      // Get Y positions for bundling
      const srcPos = this.getConnectorPos(conn.source_stage_profile_id, conn.connection_type === 'RETORNO' ? 'left-out' : 'right-out');
      const tgtPos = this.getConnectorPos(conn.target_stage_profile_id, conn.connection_type === 'RETORNO' ? 'right-in' : 'left-in');
      const srcY = srcPos?.y ?? 0;
      const tgtY = tgtPos?.y ?? 0;

      const group = groups.get(key) ?? [];
      group.push({ id: conn.id, srcY, tgtY });
      groups.set(key, group);
    }

    const laneSpacing = 7;
    for (const [, items] of groups) {
      // Bundle: connections with same srcY and tgtY share a lane
      const bundleMap = new Map<string, string[]>();
      for (const item of items) {
        const bundleKey = `${item.srcY}_${item.tgtY}`;
        const bundle = bundleMap.get(bundleKey) ?? [];
        bundle.push(item.id);
        bundleMap.set(bundleKey, bundle);
      }

      const bundles = Array.from(bundleMap.values());
      for (let i = 0; i < bundles.length; i++) {
        const offset = i * laneSpacing;
        for (const id of bundles[i]) {
          result.set(id, offset);
        }
      }
    }

    return result;
  }

  private allocateSpreadOffsets(conns: BpmsVisualFlowConnection[]): Map<string, number> {
    const result = new Map<string, number>();
    const spreadSpacing = 7;

    // Group by source connector position (stageX + Y)
    const srcGroups = new Map<string, Array<{ id: string; tgtY: number }>>();
    for (const conn of conns) {
      if (conn.connection_type === 'INTRA_ETAPA' || conn.connection_type === 'AUTO_REFERENCIA') continue;
      const side: 'right-out' | 'left-out' = conn.connection_type === 'RETORNO' ? 'left-out' : 'right-out';
      const tgtSide: 'left-in' | 'right-in' = conn.connection_type === 'RETORNO' ? 'right-in' : 'left-in';
      const pos = this.getConnectorPos(conn.source_stage_profile_id, side);
      const tgtPos = this.getConnectorPos(conn.target_stage_profile_id, tgtSide);
      if (!pos || !tgtPos) continue;
      const stageX = this.getStageXForProfile(conn.source_stage_profile_id);
      const key = `src_${stageX}_${pos.y}`;
      const group = srcGroups.get(key) ?? [];
      group.push({ id: conn.id, tgtY: tgtPos.y });
      srcGroups.set(key, group);
    }

    for (const [key, items] of srcGroups) {
      // Extract srcY from key
      const srcY = parseFloat(key.split('_').pop()!);
      // Only spread items where source and target are NOT on the same line
      const needsSpread = items.filter((item) => Math.abs(item.tgtY - srcY) >= 2);
      if (needsSpread.length <= 1) continue;
      const total = (needsSpread.length - 1) * spreadSpacing;
      const start = -total / 2;
      for (let i = 0; i < needsSpread.length; i++) {
        result.set(needsSpread[i].id, start + i * spreadSpacing);
      }
    }

    return result;
  }

  private allocateDisplaySpreadOffsets(
    items: Array<{ id: string; sourceDisplayId: string; targetDisplayId: string; type: ConnectionType }>,
  ): Map<string, number> {
    const result = new Map<string, number>();
    const spreadSpacing = 7;

    const srcGroups = new Map<string, Array<{ id: string; tgtY: number }>>();
    for (const item of items) {
      const srcStageX = this.getDisplayStageX(item.sourceDisplayId);
      const tgtStageX = this.getDisplayStageX(item.targetDisplayId);
      if (srcStageX === tgtStageX) continue;
      const side: 'right-out' | 'left-out' = item.type === 'RETORNO' ? 'left-out' : 'right-out';
      const tgtSide: 'left-in' | 'right-in' = item.type === 'RETORNO' ? 'right-in' : 'left-in';
      const pos = this.getDisplayConnectorPos(item.sourceDisplayId, side);
      const tgtPos = this.getDisplayConnectorPos(item.targetDisplayId, tgtSide);
      if (!pos || !tgtPos) continue;
      const key = `src_${srcStageX}_${pos.y}`;
      const group = srcGroups.get(key) ?? [];
      group.push({ id: item.id, tgtY: tgtPos.y });
      srcGroups.set(key, group);
    }

    for (const [key, groupItems] of srcGroups) {
      const srcY = parseFloat(key.split('_').pop()!);
      const needsSpread = groupItems.filter((gi) => Math.abs(gi.tgtY - srcY) >= 2);
      if (needsSpread.length <= 1) continue;
      const total = (needsSpread.length - 1) * spreadSpacing;
      const start = -total / 2;
      for (let i = 0; i < needsSpread.length; i++) {
        result.set(needsSpread[i].id, start + i * spreadSpacing);
      }
    }

    return result;
  }

  /**
   * Builds an orthogonal SVG path with rounded corners using quadratic bezier at each turn.
   * Path: source → horizontal to midX → vertical to target.y → horizontal to target
   */
  private buildRoundedOrthogonal(
    src: ConnectorPos, tgt: ConnectorPos, midX: number, r: number, _direction: 'right' | 'left', spreadOffset = 0,
  ): string {
    const dy = tgt.y - src.y;
    if (Math.abs(dy) < 2 && spreadOffset === 0) {
      return `M ${src.x} ${src.y} H ${tgt.x}`;
    }

    const srcAdjY = src.y + spreadOffset;
    const tgtAdjY = tgt.y - spreadOffset;

    // Clamp radius to available space
    const vertDist = Math.abs(tgtAdjY - srcAdjY);
    const maxR = Math.min(r, Math.abs(midX - src.x) - 1, Math.abs(midX - tgt.x) - 1, vertDist / 2);
    const cr = Math.max(0, maxR);

    if (cr < 2) {
      return `M ${src.x} ${src.y} L ${midX} ${srcAdjY} V ${tgtAdjY} L ${tgt.x} ${tgt.y}`;
    }

    const goingRight1 = midX > src.x;
    const goingDown = tgtAdjY > srcAdjY;
    const goingRight2 = tgt.x > midX;

    // First corner: end of angled segment, start of vertical
    const c1x = goingRight1 ? midX - cr : midX + cr;
    const c1y = goingDown ? srcAdjY + cr : srcAdjY - cr;

    // Second corner: end of vertical, start of angled segment
    const c2y = goingDown ? tgtAdjY - cr : tgtAdjY + cr;
    const c2x = goingRight2 ? midX + cr : midX - cr;

    // Interpolate Y along the angled source segment at c1x
    const srcSegLen = midX - src.x;
    const c1Ratio = srcSegLen !== 0 ? (c1x - src.x) / srcSegLen : 0;
    const c1AdjY = src.y + c1Ratio * (srcAdjY - src.y);

    // Interpolate Y along the angled target segment at c2x
    const tgtSegLen = tgt.x - midX;
    const c2Ratio = tgtSegLen !== 0 ? (c2x - midX) / tgtSegLen : 0;
    const c2AdjY = tgtAdjY + c2Ratio * (tgt.y - tgtAdjY);

    return [
      `M ${src.x} ${src.y}`,
      `L ${c1x} ${c1AdjY}`,
      `Q ${midX} ${srcAdjY} ${midX} ${c1y}`,
      `V ${c2y}`,
      `Q ${midX} ${tgtAdjY} ${c2x} ${c2AdjY}`,
      `L ${tgt.x} ${tgt.y}`
    ].join(' ');
  }

  getConnectionCssClass(type: ConnectionType): string {
    return 'connection-' + type.toLowerCase().replace('_', '-');
  }

  getStrokeDasharray(type: ConnectionType): string {
    return 'none';
  }

  getStrokeColor(type: ConnectionType): string {
    switch (type) {
      case 'AVANCO': return '#22c55e';
      case 'RETORNO': return '#f97316';
      case 'INTRA_ETAPA': return '#3b82f6';
      case 'AUTO_REFERENCIA': return '#a855f7';
    }
  }
}
