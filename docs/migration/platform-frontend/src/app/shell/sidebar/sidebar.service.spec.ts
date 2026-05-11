import { TestBed } from '@angular/core/testing';

import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should default mode to auto', () => {
      expect(service.mode()).toBe('auto');
    });

    it('should default isHovered to false', () => {
      expect(service.isHovered()).toBe(false);
    });

    it('should default openSections to empty set', () => {
      expect(service.openSections().size).toBe(0);
    });

    it('should compute isExpanded as false when auto and not hovered', () => {
      expect(service.isExpanded()).toBe(false);
    });

    it('should compute isPinned as false when auto', () => {
      expect(service.isPinned()).toBe(false);
    });

    it('should compute effectiveWidth as 64 when auto and not hovered', () => {
      expect(service.effectiveWidth()).toBe(64);
    });
  });

  describe('sections', () => {
    it('should have intelligence and administration sections', () => {
      const sections = service.sections();
      expect(sections).toHaveLength(2);
      expect(sections[0].id).toBe('intelligence');
      expect(sections[1].id).toBe('administration');
    });

    it('should have Person under intelligence', () => {
      const intelligence = service.sections()[0];
      expect(intelligence.items).toHaveLength(1);
      expect(intelligence.items[0].route).toBe('/intelligence/person');
      expect(intelligence.items[0].label).toBe('shell.nav.person');
      expect(intelligence.items[0].icon).toBe('pi pi-users');
    });

    it('should have Users, Groups, Roles, Audit, and Invitations under administration for non-platform-admin', () => {
      const administration = service.sections()[1];
      const routes = administration.items.map((item) => item.route);
      expect(routes).toContain('/admin/users');
      expect(routes).toContain('/admin/groups');
      expect(routes).toContain('/admin/roles');
      expect(routes).toContain('/audit-logs');
      expect(routes).toContain('/admin/invitations');
      expect(routes).not.toContain('/admin/organizations');
      expect(routes).not.toContain('/admin/all-users');
    });
  });

  describe('togglePin()', () => {
    it('should toggle from pinned to auto', () => {
      service.mode.set('pinned');
      service.togglePin();
      expect(service.mode()).toBe('auto');
    });

    it('should toggle from auto to pinned', () => {
      service.togglePin();
      expect(service.mode()).toBe('pinned');
    });

    it('should toggle from collapsed to pinned', () => {
      service.mode.set('collapsed');
      service.togglePin();
      expect(service.mode()).toBe('pinned');
    });
  });

  describe('collapse()', () => {
    it('should set mode to collapsed from pinned', () => {
      service.mode.set('pinned');
      service.collapse();
      expect(service.mode()).toBe('collapsed');
    });

    it('should set mode to collapsed from auto', () => {
      service.collapse();
      expect(service.mode()).toBe('collapsed');
    });
  });

  describe('cycleMode()', () => {
    it('should cycle auto -> collapsed', () => {
      service.cycleMode();
      expect(service.mode()).toBe('collapsed');
    });

    it('should cycle collapsed -> pinned', () => {
      service.mode.set('collapsed');
      service.cycleMode();
      expect(service.mode()).toBe('pinned');
    });

    it('should cycle pinned -> auto', () => {
      service.mode.set('pinned');
      service.cycleMode();
      expect(service.mode()).toBe('auto');
    });
  });

  describe('setHovered()', () => {
    it('should set isHovered to true', () => {
      service.setHovered(true);
      expect(service.isHovered()).toBe(true);
    });

    it('should set isHovered to false', () => {
      service.setHovered(true);
      service.setHovered(false);
      expect(service.isHovered()).toBe(false);
    });
  });

  describe('computed signals', () => {
    it('should expand in auto mode when hovered', () => {
      service.mode.set('auto');
      service.setHovered(true);
      expect(service.isExpanded()).toBe(true);
      expect(service.effectiveWidth()).toBe(260);
    });

    it('should collapse in auto mode when not hovered', () => {
      service.mode.set('auto');
      service.setHovered(false);
      expect(service.isExpanded()).toBe(false);
      expect(service.effectiveWidth()).toBe(64);
    });

    it('should always be collapsed width in collapsed mode', () => {
      service.mode.set('collapsed');
      service.setHovered(true);
      expect(service.isExpanded()).toBe(false);
      expect(service.effectiveWidth()).toBe(64);
    });

    it('should always be expanded width in pinned mode', () => {
      service.mode.set('pinned');
      service.setHovered(false);
      expect(service.isExpanded()).toBe(true);
      expect(service.effectiveWidth()).toBe(260);
    });

    it('should compute isPinned as false when not pinned', () => {
      expect(service.isPinned()).toBe(false);
    });
  });

  describe('toggleSection()', () => {
    it('should add a section to openSections', () => {
      service.toggleSection('intelligence');
      expect(service.openSections().has('intelligence')).toBe(true);
    });

    it('should remove a section from openSections on second toggle', () => {
      service.toggleSection('intelligence');
      service.toggleSection('intelligence');
      expect(service.openSections().has('intelligence')).toBe(false);
    });

    it('should handle multiple sections independently', () => {
      service.toggleSection('intelligence');
      service.toggleSection('administration');
      expect(service.openSections().has('intelligence')).toBe(true);
      expect(service.openSections().has('administration')).toBe(true);
    });
  });
});
