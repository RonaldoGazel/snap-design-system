import { Injectable, inject, signal, computed } from '@angular/core';
import { BpmsApiService } from './bpms-api.service';
import {
  BpmsFlow,
  BpmsFlowVersion,
  BpmsFlowStep,
  BpmsFlowTransition,
  BpmsFlowRole,
  BpmsFlowRule,
  BpmsFlowException,
} from '../models/bpms.model';
import { StepType } from '../models/bpms.enums';

@Injectable({ providedIn: 'root' })
export class BpmsFlowStateService {
  private readonly api = inject(BpmsApiService);

  readonly currentFlow = signal<BpmsFlow | null>(null);
  readonly currentVersion = signal<BpmsFlowVersion | null>(null);
  readonly steps = signal<BpmsFlowStep[]>([]);
  readonly transitions = signal<BpmsFlowTransition[]>([]);
  readonly roles = signal<BpmsFlowRole[]>([]);
  readonly rules = signal<BpmsFlowRule[]>([]);
  readonly exceptions = signal<BpmsFlowException[]>([]);

  // Computed: id -> step
  readonly stepMap = computed(() => {
    const map = new Map<string, BpmsFlowStep>();
    for (const s of this.steps()) map.set(s.id, s);
    return map;
  });

  readonly hasInitialStep = computed(() =>
    this.steps().some(s => s.order_index === 0 || s.type === StepType.PRODUCTION),
  );

  readonly hasFinalStep = computed(() =>
    this.steps().some(s => s.type === StepType.TERMINAL),
  );

  // Steps with no outgoing transitions (excluding final steps)
  readonly orphanSteps = computed(() => {
    const fromIds = new Set(this.transitions().map(t => t.from_step_id));
    return this.steps().filter(s => s.type !== StepType.TERMINAL && !fromIds.has(s.id));
  });

  // Transitions pointing to non-existent steps
  readonly deadEndTransitions = computed(() => {
    const stepIds = new Set(this.steps().map(s => s.id));
    return this.transitions().filter(t => !stepIds.has(t.to_step_id));
  });

  // Mutations
  addStep(step: BpmsFlowStep): void {
    this.steps.update(s => [...s, step]);
  }

  updateStep(id: string, data: Partial<BpmsFlowStep>): void {
    this.steps.update(s => s.map(step => (step.id === id ? { ...step, ...data } : step)));
  }

  removeStep(id: string): void {
    this.steps.update(s => s.filter(step => step.id !== id));
    this.transitions.update(t =>
      t.filter(tr => tr.from_step_id !== id && tr.to_step_id !== id),
    );
  }

  addTransition(transition: BpmsFlowTransition): void {
    this.transitions.update(t => [...t, transition]);
  }

  addRole(role: BpmsFlowRole): void {
    this.roles.update(r => [...r, role]);
  }

  addRule(rule: BpmsFlowRule): void {
    this.rules.update(r => [...r, rule]);
  }

  addException(exception: BpmsFlowException): void {
    this.exceptions.update(e => [...e, exception]);
  }

  // Load flow and its latest version data
  loadFlow(flowId: string): void {
    this.api.getFlow(flowId).subscribe(flow => {
      this.currentFlow.set(flow);
      const latestVersion = flow.versions?.[0] ?? null;
      this.currentVersion.set(latestVersion);
      if (latestVersion) {
        this.steps.set(latestVersion.steps ?? []);
        this.transitions.set(latestVersion.transitions ?? []);
        this.roles.set(latestVersion.roles ?? []);
        const allRules = latestVersion.rules ?? [];
        this.rules.set(allRules.filter(r => !r.is_exception));
        this.exceptions.set(allRules.filter(r => r.is_exception) as BpmsFlowException[]);
      }
    });
  }

  // Save all steps, transitions, roles, rules to backend
  saveAll(): void {
    const versionId = this.currentVersion()?.id;
    if (!versionId) return;

    // Strip extra fields not in the Zod schemas (flow_version_id, etc.)
    const cleanSteps = this.steps().map(({ id, name, code, type, description, order_index, is_mandatory, role_code, config }) =>
      ({ id, name, code, type, description, order_index, is_mandatory, role_code, config }));

    const cleanTransitions = this.transitions().map(({ id, name, from_step_id, to_step_id, type, description, conditions, config }) =>
      ({ id, name, from_step_id, to_step_id, type, description, conditions, config }));

    const cleanRoles = this.roles().map(({ id, name, code, description, unit_id, profile_id, config }) =>
      ({ id, name, code, description, unit_id, profile_id, config }));

    const allRules = [...this.rules(), ...this.exceptions()];
    const cleanRules = allRules.map(({ id, name, type, scope, source_unit_id, source_profile_id, target_unit_id, target_profile_id, action, conditions, is_exception, priority, is_active }) =>
      ({ id, name, type, scope, source_unit_id, source_profile_id, target_unit_id, target_profile_id, action, conditions, is_exception, priority, is_active }));

    this.api.saveFlowSteps(versionId, cleanSteps).subscribe(saved => {
      // Remap step IDs: frontend UUID -> backend UUID
      const idMap = new Map<string, string>();
      const oldSteps = this.steps();
      saved.forEach((s, i) => {
        if (oldSteps[i]) idMap.set(oldSteps[i].id, s.id);
      });
      this.steps.set(saved);

      // Update transition step references with real IDs
      const remappedTransitions = cleanTransitions.map(t => ({
        ...t,
        from_step_id: idMap.get(t.from_step_id) ?? t.from_step_id,
        to_step_id: idMap.get(t.to_step_id) ?? t.to_step_id,
      }));

      this.api.saveFlowTransitions(versionId, remappedTransitions).subscribe(savedT => {
        this.transitions.set(savedT);
      });
    });

    this.api.saveFlowRoles(versionId, cleanRoles).subscribe(savedR => this.roles.set(savedR));
    this.api.saveFlowRules(versionId, cleanRules).subscribe(savedRules => {
      this.rules.set(savedRules.filter(r => !r.is_exception));
      this.exceptions.set(savedRules.filter(r => r.is_exception) as BpmsFlowException[]);
    });
  }
}
