/**
 * Tipos para o OrganizacaoService
 * Gerencia contexto do usuário atual e regras de compartimentação por setor
 */

/**
 * Representa um setor da organização
 * Utilizado para compartimentação de dados e controle de acesso
 */
export interface Setor {
  /** Identificador único do setor */
  id: string;

  /** Nome completo do setor */
  nome: string;

  /** Sigla do setor (ex: "DEIC", "DENARC") */
  sigla: string;

  /** Indica se o setor é de Contrainteligência (acesso irrestrito) */
  isContrainteligencia: boolean;
}

/**
 * Representa o contexto do usuário autenticado
 * Utilizado para determinar visibilidade de dados e permissões
 */
export interface UsuarioContexto {
  /** Identificador único do usuário */
  id: string;

  /** Nome completo do usuário */
  nome: string;

  /** Setor ao qual o usuário pertence */
  setor: Setor;

  /** Papel/função do usuário no sistema (ex: "ANALISTA", "GESTOR", "ADMIN") */
  role: string;
}
