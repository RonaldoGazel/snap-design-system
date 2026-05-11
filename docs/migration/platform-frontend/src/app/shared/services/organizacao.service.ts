import { Injectable, computed, signal } from '@angular/core';

import { Setor, UsuarioContexto } from '../models/organizacao.model';
import { AuthStateService } from './auth-state.service';

/**
 * OrganizacaoService
 *
 * Gerencia o contexto do usuário atual e as regras de compartimentação de dados.
 * Implementa a lógica de visibilidade baseada em setor e classificação de sigilo.
 *
 * Regra de compartimentação:
 * - Contrainteligência: vê tudo (acesso irrestrito)
 * - Outros setores: veem apenas dados com sigilo 'PUBLICO' ou setorProprietario igual ao seu setor
 *
 * Requirements: 38.1, 38.2, 38.3, 38.4, 38.5, 38.6
 */
@Injectable({ providedIn: 'root' })
export class OrganizacaoService {
  /**
   * Usuário autenticado atual com contexto de setor
   * Carregado do AuthStateService na inicialização
   */
  readonly usuarioAtual = signal<UsuarioContexto>(this.getDefaultUsuario());

  /**
   * Lista de setores disponíveis na organização
   * Utilizado para lookups e validações
   */
  readonly setores = signal<Setor[]>([]);

  /**
   * Lista de usuários disponíveis para troca de contexto (simulação)
   * Utilizado para testes de compartimentação
   */
  readonly usuariosDisponiveis = signal<UsuarioContexto[]>([]);

  constructor(private authStateService: AuthStateService) {
    // Inicializar setores e usuários disponíveis
    this.initializeSetores();
    this.initializeUsuariosDisponiveis();
    // Inicializar usuário atual após setores estarem prontos
    this.usuarioAtual.set(this.initializeUsuarioAtual());
  }

  /**
   * Troca o usuário atual para outro usuário disponível
   * Utilizado para simular mudanças de contexto de setor
   *
   * @param usuarioId - ID do usuário a ser ativado
   */
  trocarUsuario(usuarioId: string): void {
    const usuario = this.usuariosDisponiveis().find((u) => u.id === usuarioId);
    if (usuario) {
      this.usuarioAtual.set(usuario);
    }
  }

  /**
   * Verifica se o usuário atual pode visualizar uma pessoa
   * Implementa a regra de compartimentação:
   * - Se usuário é Contrainteligência: retorna true (vê tudo)
   * - Se sigilo é 'PUBLICO': retorna true (público)
   * - Se setorProprietario é igual ao setor do usuário: retorna true (mesmo setor)
   * - Caso contrário: retorna false (acesso negado)
   *
   * @param pessoa - Objeto com sigilo e setorProprietario
   * @returns true se o usuário pode visualizar, false caso contrário
   */
  podVerPessoa(pessoa: { sigilo: string; setorProprietario: string }): boolean {
    // Contrainteligência vê tudo
    if (this.isContrainteligencia()) {
      return true;
    }

    // Sigilo público é visível para todos
    if (pessoa.sigilo === 'PUBLICO') {
      return true;
    }

    // Mesmo setor pode visualizar
    if (pessoa.setorProprietario === this.usuarioAtual().setor.id) {
      return true;
    }

    // Caso contrário, acesso negado
    return false;
  }

  /**
   * Verifica se o usuário atual pertence ao setor de Contrainteligência
   * Contrainteligência tem acesso irrestrito a todos os dados
   *
   * @returns true se o setor é Contrainteligência, false caso contrário
   */
  isContrainteligencia(): boolean {
    return this.usuarioAtual().setor.isContrainteligencia;
  }

  /**
   * Busca um setor pelo ID
   *
   * @param setorId - ID do setor a buscar
   * @returns O setor encontrado ou undefined
   */
  getSetorById(setorId: string): Setor | undefined {
    return this.setores().find((s) => s.id === setorId);
  }

  /**
   * Inicializa o usuário atual a partir do AuthStateService
   * Mapeia o User para UsuarioContexto
   *
   * @returns UsuarioContexto com dados do usuário autenticado
   */
  private initializeUsuarioAtual(): UsuarioContexto {
    const currentUser = this.authStateService.currentUser();

    if (!currentUser) {
      return this.getDefaultUsuario();
    }

    // Mapear User para UsuarioContexto
    const setor: Setor = currentUser.sectors
      ? {
          id: currentUser.sectors.id,
          nome: currentUser.sectors.name,
          sigla: currentUser.sectors.acronym,
          isContrainteligencia: currentUser.sectors.acronym === 'CONTRAINTELIGENCIA',
        }
      : {
          id: currentUser.sector_id || '',
          nome: 'Setor Desconhecido',
          sigla: 'N/A',
          isContrainteligencia: false,
        };

    return {
      id: currentUser.id,
      nome: currentUser.name,
      setor,
      role: currentUser.role,
    };
  }

  /**
   * Retorna um usuário padrão quando não autenticado
   */
  private getDefaultUsuario(): UsuarioContexto {
    return {
      id: '',
      nome: 'Usuário Anônimo',
      setor: {
        id: '',
        nome: 'Sem Setor',
        sigla: 'N/A',
        isContrainteligencia: false,
      },
      role: '',
    };
  }

  /**
   * Inicializa a lista de setores disponíveis
   * Em produção, seria carregado via API
   */
  private initializeSetores(): void {
    // Setores padrão para demonstração
    const setoresPadrao: Setor[] = [
      {
        id: '1',
        nome: 'Contrainteligência',
        sigla: 'CONTRAINTELIGENCIA',
        isContrainteligencia: true,
      },
      {
        id: '2',
        nome: 'Departamento de Investigações Criminais',
        sigla: 'DEIC',
        isContrainteligencia: false,
      },
      {
        id: '3',
        nome: 'Departamento de Narcóticos',
        sigla: 'DENARC',
        isContrainteligencia: false,
      },
      {
        id: '4',
        nome: 'Departamento de Polícia Judiciária',
        sigla: 'DPJ',
        isContrainteligencia: false,
      },
    ];

    this.setores.set(setoresPadrao);
  }

  /**
   * Inicializa a lista de usuários disponíveis para troca de contexto
   * Em produção, seria carregado via API
   */
  private initializeUsuariosDisponiveis(): void {
    const setoresPadrao = this.setores();

    const usuariosPadrao: UsuarioContexto[] = [
      {
        id: 'user-1',
        nome: 'Analista DEIC',
        setor: setoresPadrao[1],
        role: 'ANALISTA',
      },
      {
        id: 'user-2',
        nome: 'Analista DENARC',
        setor: setoresPadrao[2],
        role: 'ANALISTA',
      },
      {
        id: 'user-3',
        nome: 'Analista Contrainteligência',
        setor: setoresPadrao[0],
        role: 'ANALISTA',
      },
      {
        id: 'user-4',
        nome: 'Gestor DPJ',
        setor: setoresPadrao[3],
        role: 'GESTOR',
      },
    ];

    this.usuariosDisponiveis.set(usuariosPadrao);
  }
}
