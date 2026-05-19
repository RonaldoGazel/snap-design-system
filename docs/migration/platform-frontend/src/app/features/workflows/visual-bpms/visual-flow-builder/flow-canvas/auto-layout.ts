import { BpmsVisualFlowStage, BpmsVisualFlowStageProfile, BpmsVisualFlowConnection } from '../../../models/visual-bpms.model';

interface GroupSlot {
  key: string;           // profile_id (group key)
  memberIds: Set<string>; // stage_profile ids in this group
  members: BpmsVisualFlowStageProfile[];
}

/**
 * Group-aware barycenter heuristic for reducing edge crossings.
 *
 * Profiles are grouped by profile_id (same grouping logic as the canvas).
 * Each group is treated as a single node for barycenter calculation.
 * Connected groups are aligned to the same row across adjacent stages.
 * Groups/individuals without connections are pushed to the bottom.
 */
export function computeAutoLayout(
  stages: BpmsVisualFlowStage[],
  connections: BpmsVisualFlowConnection[],
): BpmsVisualFlowStage[] {
  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index);
  if (sorted.length < 2) return stages;

  // Build group slots per stage
  const stageGroups: GroupSlot[][] = sorted.map((stage) => {
    const groups = new Map<string, GroupSlot>();
    for (const p of stage.profiles ?? []) {
      const key = p.unit_profile?.profile_id ?? p.id;
      const existing = groups.get(key);
      if (existing) {
        existing.memberIds.add(p.id);
        existing.members.push(p);
      } else {
        groups.set(key, { key, memberIds: new Set([p.id]), members: [p] });
      }
    }
    return Array.from(groups.values());
  });

  // Map: stage_profile_id → group key within its stage
  const profileToGroupKey = new Map<string, string>();
  for (const stage of sorted) {
    for (const p of stage.profiles ?? []) {
      profileToGroupKey.set(p.id, p.unit_profile?.profile_id ?? p.id);
    }
  }

  // Process each adjacent pair (left to right)
  for (let i = 0; i < stageGroups.length - 1; i++) {
    const currentGroups = stageGroups[i];
    const nextGroups = stageGroups[i + 1];
    if (nextGroups.length <= 1) continue;

    // Build position map: group key → index in current stage
    const currentPosMap = new Map<string, number>();
    currentGroups.forEach((g, idx) => currentPosMap.set(g.key, idx));

    // Build set of all member ids in current stage for fast lookup
    const currentMemberIds = new Set<string>();
    for (const g of currentGroups) {
      for (const id of g.memberIds) currentMemberIds.add(id);
    }

    // For each group in next stage, compute barycenter
    const barycenters = new Map<string, number>();
    const hasConnection = new Set<string>();

    for (const group of nextGroups) {
      const connectedPositions: number[] = [];

      for (const conn of connections) {
        // Forward: current → next (target is in this group)
        if (group.memberIds.has(conn.target_stage_profile_id) && currentMemberIds.has(conn.source_stage_profile_id)) {
          const srcGroupKey = profileToGroupKey.get(conn.source_stage_profile_id);
          if (srcGroupKey !== undefined) {
            const pos = currentPosMap.get(srcGroupKey);
            if (pos !== undefined) connectedPositions.push(pos);
          }
        }
        // Backward: next → current (source is in this group)
        if (group.memberIds.has(conn.source_stage_profile_id) && currentMemberIds.has(conn.target_stage_profile_id)) {
          const tgtGroupKey = profileToGroupKey.get(conn.target_stage_profile_id);
          if (tgtGroupKey !== undefined) {
            const pos = currentPosMap.get(tgtGroupKey);
            if (pos !== undefined) connectedPositions.push(pos);
          }
        }
      }

      if (connectedPositions.length > 0) {
        const avg = connectedPositions.reduce((sum, v) => sum + v, 0) / connectedPositions.length;
        barycenters.set(group.key, avg);
        hasConnection.add(group.key);
      }
    }

    // Sort: connected groups by barycenter first, unconnected at the end
    const reordered = [...nextGroups].sort((a, b) => {
      const aConnected = hasConnection.has(a.key);
      const bConnected = hasConnection.has(b.key);
      if (aConnected && !bConnected) return -1;
      if (!aConnected && bConnected) return 1;
      if (!aConnected && !bConnected) return 0;
      return (barycenters.get(a.key) ?? 0) - (barycenters.get(b.key) ?? 0);
    });

    stageGroups[i + 1] = reordered;
  }

  // Rebuild stages with reordered profiles
  const result = sorted.map((stage, si) => {
    const orderedProfiles: BpmsVisualFlowStageProfile[] = [];
    let idx = 0;
    for (const group of stageGroups[si]) {
      for (const member of group.members) {
        orderedProfiles.push({ ...member, order_index: idx++ });
      }
    }
    return { ...stage, profiles: orderedProfiles };
  });

  return result;
}
