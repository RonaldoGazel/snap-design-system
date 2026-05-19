export interface Attachment {
  id: string;
  document_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_type?: string;
  file_size: number;
  mime_type?: string;
  origin?: string;
  summary?: string;
  keywords?: string;
  author?: string;
  document_date?: string;
  ocr_text_content?: string;
  ocr_processed: boolean;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}
