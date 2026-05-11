import type { User, Sector } from './user.model';
import type { Attachment } from './attachment.model';

export interface Document {
  id: string;
  process_id: string;
  parent_id?: string;
  title: string;
  content?: string;
  type: string;
  security_classification: string;
  status: string;
  order_index: number;
  version: number;
  is_active: boolean;
  /** Whether the document has an associated DOCX file for Collabora editing. */
  has_file?: boolean;
  /** Original filename of the uploaded DOCX. */
  original_filename?: string | null;
  creator_id: string;
  current_sector_id: string;
  assigned_user_id?: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  sector?: Sector;
  attachments?: Attachment[];
  children?: Document[];
  document_versions?: DocumentVersion[];
  document_accesses?: DocumentAccess[];
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  title: string;
  content?: string;
  created_at: string;
  created_by: string;
}

export interface DocumentAccess {
  id: string;
  document_id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}
