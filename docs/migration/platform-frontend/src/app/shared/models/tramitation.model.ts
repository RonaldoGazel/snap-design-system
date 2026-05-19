import type { Sector } from './user.model';

export interface Tramitation {
  id: string;
  process_id: string;
  from_sector_id: string;
  to_sector_id: string;
  user_id: string;
  observation?: string;
  status: string;
  sent_at: string;
  received_at?: string;
  received_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  from_sector?: Sector;
  to_sector?: Sector;
}
