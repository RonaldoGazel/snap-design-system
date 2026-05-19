export interface GeneratePersonRequest {
  cpf: string; // 11 numeric digits, no formatting
}

export interface GeneratePersonResponse {
  status: string;
  message: string;
}

export type SnapSearchErrorCode =
  | 'badRequest'
  | 'forbidden'
  | 'notFound'
  | 'serviceUnavailable'
  | 'networkError';

export interface SnapSearchError {
  code: SnapSearchErrorCode;
  retryable: boolean;
}
