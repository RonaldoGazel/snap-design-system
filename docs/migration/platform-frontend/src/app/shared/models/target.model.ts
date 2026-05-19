export interface Target {
  id: string;
  name: string;
  alias?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  nationality?: string;
  profession?: string;
  address?: string;
  phone?: string;
  email?: string;
  snap_data?: Record<string, unknown>;
  snap_last_update?: string;
  snap_status?: string;
  mother_name?: string;
  father_name?: string;
  birth_place?: string;
  marital_status?: string;
  education_level?: string;
  income_range?: string;
  addresses?: Record<string, unknown>[];
  phones?: Record<string, unknown>[];
  emails?: Record<string, unknown>[];
  social_networks?: Record<string, unknown>[];
  companies?: Record<string, unknown>[];
  financial_data?: Record<string, unknown>[];
  relatives?: Record<string, unknown>[];
  height?: string;
  weight?: string;
  hair_color?: string;
  eye_color?: string;
  skin_color?: string;
  distinguishing_marks?: string;
  threat_level: string;
  criminal_record?: string;
  known_associates?: string;
  activities?: string;
  locations_frequented?: string;
  vehicles?: string;
  observations?: string;
  intelligence_notes?: string;
  analyst_notes?: string;
  last_seen_date?: string;
  last_seen_location?: string;
  security_classification: string;
  created_by?: string;
  current_sector_id?: string;
  data_source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  faction?: string;
  prison?: string;
  vulgo?: string;
  is_leadership: boolean;
  main_criminal_types?: string;
  link_analysis_graph?: Record<string, unknown>;
  photos?: TargetPhoto[];
  reports?: TargetReport[];
  relationships?: TargetRelationship[];
}

export interface TargetPhoto {
  id: string;
  target_id: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size: number;
  description?: string;
  is_primary: boolean;
  created_at: string;
  created_by?: string;
}

export interface TargetReport {
  id: string;
  target_id: string;
  document_id: string;
  created_at: string;
  created_by?: string;
}

export interface TargetRelationship {
  id: string;
  from_target_id: string;
  to_target_id: string;
  relationship_type: string;
  description?: string;
  strength: string;
  verified: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
