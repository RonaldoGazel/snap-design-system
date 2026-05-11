import type { User, Sector } from './user.model';
import type { Document } from './document.model';
import type { Tramitation } from './tramitation.model';

export interface Process {
  id: string;
  nup: string;
  title: string;
  description?: string;
  status: string;
  security_classification: string;
  priority: string;
  distribution: string;
  doc_type: string;
  creator_id: string;
  current_sector_id: string;
  assigned_user_id?: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  sector?: Sector;
  documents?: Document[];
  tramitations?: Tramitation[];
}
