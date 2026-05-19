export interface NavItem {
  label: string; // i18n translation key
  icon: string; // PrimeNG icon class (e.g., 'pi pi-database')
  route: string; // Router path (e.g., '/snap')
  items?: NavItem[]; // Optional sub-items for expandable navigation
}

export interface NavSection {
  id: string; // Unique section identifier
  label: string; // i18n translation key
  icon: string; // PrimeNG icon class
  items: NavItem[]; // Navigation items in this section
}
