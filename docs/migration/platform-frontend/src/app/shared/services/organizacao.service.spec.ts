import { TestBed } from '@angular/core/testing';

import { AuthStateService } from './auth-state.service';
import { OrganizacaoService } from './organizacao.service';

describe('OrganizacaoService', () => {
  let service: OrganizacaoService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganizacaoService, AuthStateService],
    });
    service = TestBed.inject(OrganizacaoService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('usuarioAtual signal', () => {
    it('should initialize with current user from AuthStateService', () => {
      const usuario = service.usuarioAtual();
      expect(usuario).toBeDefined();
      expect(usuario.id).toBeDefined();
      expect(usuario.nome).toBeDefined();
      expect(usuario.setor).toBeDefined();
      expect(usuario.role).toBeDefined();
    });

    it('should have a valid setor with required properties', () => {
      const usuario = service.usuarioAtual();
      expect(usuario.setor.id).toBeDefined();
      expect(usuario.setor.nome).toBeDefined();
      expect(usuario.setor.sigla).toBeDefined();
      expect(typeof usuario.setor.isContrainteligencia).toBe('boolean');
    });
  });

  describe('setores signal', () => {
    it('should initialize with default setores', () => {
      const setores = service.setores();
      expect(Array.isArray(setores)).toBe(true);
      expect(setores.length).toBeGreaterThan(0);
    });

    it('should contain Contrainteligência setor', () => {
      const setores = service.setores();
      const contrainteligencia = setores.find((s) => s.isContrainteligencia);
      expect(contrainteligencia).toBeDefined();
      expect(contrainteligencia?.sigla).toBe('CONTRAINTELIGENCIA');
    });

    it('should contain other setores', () => {
      const setores = service.setores();
      const naoContrainteligencia = setores.filter((s) => !s.isContrainteligencia);
      expect(naoContrainteligencia.length).toBeGreaterThan(0);
    });
  });

  describe('usuariosDisponiveis signal', () => {
    it('should initialize with available users', () => {
      const usuarios = service.usuariosDisponiveis();
      expect(Array.isArray(usuarios)).toBe(true);
      expect(usuarios.length).toBeGreaterThan(0);
    });

    it('should contain users from different setores', () => {
      const usuarios = service.usuariosDisponiveis();
      const setoresUnicos = new Set(usuarios.map((u) => u.setor.id));
      expect(setoresUnicos.size).toBeGreaterThan(1);
    });
  });

  describe('trocarUsuario(id)', () => {
    it('should change usuarioAtual to specified user', () => {
      const usuarios = service.usuariosDisponiveis();
      const novoUsuario = usuarios[0];
      const usuarioAnterior = service.usuarioAtual();

      service.trocarUsuario(novoUsuario.id);

      const usuarioAtual = service.usuarioAtual();
      expect(usuarioAtual.id).toBe(novoUsuario.id);
      expect(usuarioAtual.nome).toBe(novoUsuario.nome);
      expect(usuarioAtual.setor.id).toBe(novoUsuario.setor.id);
    });

    it('should not change usuarioAtual if user not found', () => {
      const usuarioAnterior = service.usuarioAtual();
      service.trocarUsuario('usuario-inexistente');
      const usuarioAtual = service.usuarioAtual();

      expect(usuarioAtual.id).toBe(usuarioAnterior.id);
    });

    it('should allow switching between different setores', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuario1 = usuarios.find((u) => !u.setor.isContrainteligencia);
      const usuario2 = usuarios.find(
        (u) => u.setor.id !== usuario1?.setor.id && !u.setor.isContrainteligencia,
      );

      if (usuario1 && usuario2) {
        service.trocarUsuario(usuario1.id);
        expect(service.usuarioAtual().setor.id).toBe(usuario1.setor.id);

        service.trocarUsuario(usuario2.id);
        expect(service.usuarioAtual().setor.id).toBe(usuario2.setor.id);
      }
    });
  });

  describe('isContrainteligencia()', () => {
    it('should return true when user is from Contrainteligência setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuarioContrainteligencia = usuarios.find((u) => u.setor.isContrainteligencia);

      if (usuarioContrainteligencia) {
        service.trocarUsuario(usuarioContrainteligencia.id);
        expect(service.isContrainteligencia()).toBe(true);
      }
    });

    it('should return false when user is not from Contrainteligência setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuarioNaoContrainteligencia = usuarios.find((u) => !u.setor.isContrainteligencia);

      if (usuarioNaoContrainteligencia) {
        service.trocarUsuario(usuarioNaoContrainteligencia.id);
        expect(service.isContrainteligencia()).toBe(false);
      }
    });
  });

  describe('getSetorById(id)', () => {
    it('should return setor when found', () => {
      const setores = service.setores();
      const setorId = setores[0].id;

      const setor = service.getSetorById(setorId);

      expect(setor).toBeDefined();
      expect(setor?.id).toBe(setorId);
    });

    it('should return undefined when setor not found', () => {
      const setor = service.getSetorById('setor-inexistente');
      expect(setor).toBeUndefined();
    });

    it('should find Contrainteligência setor by id', () => {
      const setores = service.setores();
      const contrainteligencia = setores.find((s) => s.isContrainteligencia);

      if (contrainteligencia) {
        const found = service.getSetorById(contrainteligencia.id);
        expect(found).toBeDefined();
        expect(found?.isContrainteligencia).toBe(true);
      }
    });
  });

  describe('podVerPessoa(pessoa)', () => {
    it('should return true for Contrainteligência user regardless of sigilo or setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuarioContrainteligencia = usuarios.find((u) => u.setor.isContrainteligencia);

      if (usuarioContrainteligencia) {
        service.trocarUsuario(usuarioContrainteligencia.id);

        const pessoa1 = { sigilo: 'SIGILOSO', setorProprietario: 'outro-setor' };
        const pessoa2 = { sigilo: 'RESERVADO', setorProprietario: 'outro-setor' };
        const pessoa3 = { sigilo: 'PUBLICO', setorProprietario: 'outro-setor' };

        expect(service.podVerPessoa(pessoa1)).toBe(true);
        expect(service.podVerPessoa(pessoa2)).toBe(true);
        expect(service.podVerPessoa(pessoa3)).toBe(true);
      }
    });

    it('should return true for PUBLICO sigilo regardless of setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuarioNaoContrainteligencia = usuarios.find((u) => !u.setor.isContrainteligencia);

      if (usuarioNaoContrainteligencia) {
        service.trocarUsuario(usuarioNaoContrainteligencia.id);

        const pessoa = { sigilo: 'PUBLICO', setorProprietario: 'outro-setor' };
        expect(service.podVerPessoa(pessoa)).toBe(true);
      }
    });

    it('should return true when setorProprietario matches user setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuario = usuarios.find((u) => !u.setor.isContrainteligencia);

      if (usuario) {
        service.trocarUsuario(usuario.id);

        const pessoa = { sigilo: 'SIGILOSO', setorProprietario: usuario.setor.id };
        expect(service.podVerPessoa(pessoa)).toBe(true);
      }
    });

    it('should return false for SIGILOSO/RESERVADO from different setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuario1 = usuarios.find((u) => !u.setor.isContrainteligencia);
      const usuario2 = usuarios.find(
        (u) => !u.setor.isContrainteligencia && u.setor.id !== usuario1?.setor.id,
      );

      if (usuario1 && usuario2) {
        service.trocarUsuario(usuario1.id);

        const pessoa = { sigilo: 'SIGILOSO', setorProprietario: usuario2.setor.id };
        expect(service.podVerPessoa(pessoa)).toBe(false);
      }
    });

    it('should return false for RESERVADO from different setor', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuario1 = usuarios.find((u) => !u.setor.isContrainteligencia);
      const usuario2 = usuarios.find(
        (u) => !u.setor.isContrainteligencia && u.setor.id !== usuario1?.setor.id,
      );

      if (usuario1 && usuario2) {
        service.trocarUsuario(usuario1.id);

        const pessoa = { sigilo: 'RESERVADO', setorProprietario: usuario2.setor.id };
        expect(service.podVerPessoa(pessoa)).toBe(false);
      }
    });

    it('should implement compartmentalization rule correctly', () => {
      // Test the complete compartmentalization rule:
      // - Contrainteligência sees everything
      // - Others see only PUBLICO or same setor
      const usuarios = service.usuariosDisponiveis();

      // Test with Contrainteligência
      const contrainteligencia = usuarios.find((u) => u.setor.isContrainteligencia);
      if (contrainteligencia) {
        service.trocarUsuario(contrainteligencia.id);
        expect(service.podVerPessoa({ sigilo: 'SIGILOSO', setorProprietario: 'any' })).toBe(true);
      }

      // Test with regular user
      const regular = usuarios.find((u) => !u.setor.isContrainteligencia);
      if (regular) {
        service.trocarUsuario(regular.id);

        // Can see PUBLICO
        expect(service.podVerPessoa({ sigilo: 'PUBLICO', setorProprietario: 'any' })).toBe(true);

        // Can see same setor
        expect(
          service.podVerPessoa({ sigilo: 'SIGILOSO', setorProprietario: regular.setor.id }),
        ).toBe(true);

        // Cannot see different setor
        expect(service.podVerPessoa({ sigilo: 'SIGILOSO', setorProprietario: 'other' })).toBe(
          false,
        );
      }
    });
  });

  describe('Compartmentalization Rules', () => {
    it('should enforce compartmentalization for non-Contrainteligência users', () => {
      const usuarios = service.usuariosDisponiveis();
      const usuario = usuarios.find((u) => !u.setor.isContrainteligencia);

      if (usuario) {
        service.trocarUsuario(usuario.id);

        // Scenario 1: PUBLICO data is always visible
        expect(service.podVerPessoa({ sigilo: 'PUBLICO', setorProprietario: 'any-setor' })).toBe(
          true,
        );

        // Scenario 2: Same setor data is visible
        expect(
          service.podVerPessoa({ sigilo: 'RESERVADO', setorProprietario: usuario.setor.id }),
        ).toBe(true);

        // Scenario 3: Different setor RESERVADO is not visible
        expect(
          service.podVerPessoa({ sigilo: 'RESERVADO', setorProprietario: 'different-setor' }),
        ).toBe(false);

        // Scenario 4: Different setor SIGILOSO is not visible
        expect(
          service.podVerPessoa({ sigilo: 'SIGILOSO', setorProprietario: 'different-setor' }),
        ).toBe(false);
      }
    });
  });
});
