// =====================================================================================
// SERVIÇO DE RANKING - SISTEMA DE PONTUAÇÃO E VALIDAÇÃO DE DESCARTES
// =====================================================================================
// Este serviço gerencia o sistema de gamificação da aplicação:
// - Registro de descartes de lixo pelos usuários
// - Validação de registros por administradores
// - Sistema de pontuação e ranking
// - Persistência de dados em localStorage
//
// FUNCIONALIDADES PRINCIPAIS:
// - Usuários registram descartes com foto e localização GPS
// - Administradores validam registros e atribuem pontos
// - Ranking mostra os usuários mais ativos no descarte consciente
//
// IMPORTANTE: Em produção, isso seria integrado com um backend real
// =====================================================================================

import { Injectable } from '@angular/core';

// =====================================================================================
// TIPOS E INTERFACES - DEFINIÇÃO DE DADOS DO SISTEMA DE RANKING
// =====================================================================================

// Status possíveis para um registro de descarte
export type StatusRegistro = 'pendente' | 'validado';

// Interface para registros de descarte de lixo
export interface RegistroDescarte {
  id: string;           // Identificador único do registro
  email: string;        // Email do usuário que fez o descarte
  fotoDataUrl: string;  // Foto do descarte em formato base64
  lat: number;          // Latitude da localização GPS
  lng: number;          // Longitude da localização GPS
  dataISO: string;      // Data/hora do registro em formato ISO
  status: StatusRegistro; // Status: pendente ou validado
}

// Interface para entradas do ranking de usuários
export interface RankingEntry {
  email: string;        // Email do usuário
  pontos: number;       // Pontuação total acumulada
}

// =====================================================================================
// SERVIÇO PRINCIPAL - LÓGICA DE RANKING E VALIDAÇÃO
// =====================================================================================
@Injectable({
  providedIn: 'root'  // Serviço singleton disponível globalmente
})
export class RankingService {
  // ===================================================================================
  // PROPRIEDADES PRIVADAS - CONFIGURAÇÃO DE PERSISTÊNCIA
  // ===================================================================================
  private registrosKey = 'registrosDescarte';  // Chave para registros no localStorage
  private rankingKey = 'rankingDescarte';      // Chave para ranking no localStorage

  // ===================================================================================
  // MÉTODOS PÚBLICOS - API DO SISTEMA DE RANKING
  // ===================================================================================

  /**
   * REGISTRA UM NOVO DESCARTE DE LIXO
   *
   * Este método é chamado quando um usuário registra um descarte através do app.
   * Cria um novo registro com status 'pendente' que precisa ser validado por um
   * administrador para liberar os pontos.
   *
   * Processo:
   * 1. Gera ID único baseado em timestamp e número aleatório
   * 2. Cria registro com dados fornecidos + data atual
   * 3. Adiciona no início da lista (mais recentes primeiro)
   * 4. Salva no localStorage
   *
   * @param email - Email do usuário que fez o descarte
   * @param fotoDataUrl - Foto do descarte em base64
   * @param lat - Latitude da localização GPS
   * @param lng - Longitude da localização GPS
   * @returns O registro criado
   */
  registrarDescarte(email: string, fotoDataUrl: string, lat: number, lng: number): RegistroDescarte {
    const registros = this.getRegistros();  // Recupera registros existentes
    const registro: RegistroDescarte = {
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,  // ID único
      email,
      fotoDataUrl,
      lat,
      lng,
      dataISO: new Date().toISOString(),  // Data/hora atual em ISO
      status: 'pendente'  // Novos registros sempre começam pendentes
    };

    registros.unshift(registro);  // Adiciona no início (ordem cronológica reversa)
    this.salvarRegistros(registros);  // Persiste no localStorage
    return registro;
  }

  /**
   * VALIDA UM REGISTRO PENDENTE E ATRIBUI PONTOS AO USUÁRIO
   *
   * Método usado por administradores para validar registros de descarte.
   * Quando validado, o registro muda de status e o usuário ganha 10 pontos
   * no ranking.
   *
   * Regras de validação:
   * - Só pode validar registros com status 'pendente'
   * - Atribui 10 pontos por descarte validado
   * - Atualiza ranking automaticamente
   *
   * @param id - ID do registro a ser validado
   * @returns true se validado com sucesso, false caso contrário
   */
  validarRegistro(id: string): boolean {
    const registros = this.getRegistros();  // Recupera todos os registros
    const registro = registros.find(r => r.id === id);  // Encontra o registro específico

    // Validações de segurança
    if (!registro || registro.status === 'validado') {
      return false;  // Registro não encontrado ou já validado
    }

    registro.status = 'validado';  // Muda status para validado
    this.salvarRegistros(registros);  // Salva mudança de status
    this.adicionarPontos(registro.email, 10);  // Atribui 10 pontos ao usuário
    return true;
  }

  /**
   * RETORNA TODOS OS REGISTROS DE DESCARTE
   *
   * Método utilitário para recuperar todos os registros armazenados.
   * Inclui tratamento de erros para localStorage corrompido.
   *
   * @returns Array com todos os registros de descarte
   */
  getRegistros(): RegistroDescarte[] {
    const dados = localStorage.getItem(this.registrosKey);  // Tenta recuperar do localStorage
    if (!dados) {
      return [];  // Retorna array vazio se não houver dados
    }
    try {
      return JSON.parse(dados) as RegistroDescarte[];  // Faz parse do JSON
    } catch {
      return [];  // Retorna array vazio em caso de erro no parse
    }
  }

  /**
   * RETORNA APENAS OS REGISTROS PENDENTES DE VALIDAÇÃO
   *
   * Método usado na interface de administração para mostrar registros
   * que ainda precisam ser validados pelos administradores.
   *
   * @returns Array filtrado com apenas registros pendentes
   */
  getRegistrosPendentes(): RegistroDescarte[] {
    return this.getRegistros().filter(r => r.status === 'pendente');
  }

  /**
   * RETORNA OS REGISTROS DE UM USUÁRIO ESPECÍFICO
   *
   * Método usado para mostrar o histórico de descartes de um usuário
   * no seu perfil ou painel pessoal.
   *
   * @param email - Email do usuário
   * @returns Array com todos os registros do usuário
   */
  getRegistrosPorUsuario(email: string): RegistroDescarte[] {
    return this.getRegistros().filter(r => r.email === email);
  }

  /**
   * RETORNA O RANKING GERAL ORDENADO POR PONTOS
   *
   * Método principal para exibir o ranking de usuários.
   * Ordena automaticamente por pontuação decrescente (maior para menor).
   *
   * @returns Array ordenado com ranking de usuários
   */
  getRanking(): RankingEntry[] {
    const dados = localStorage.getItem(this.rankingKey);  // Recupera ranking do localStorage
    if (!dados) {
      return [];  // Retorna array vazio se não houver ranking
    }
    try {
      const ranking = JSON.parse(dados) as RankingEntry[];  // Faz parse do JSON
      // Ordena por pontos decrescentes (maior pontuação primeiro)
      return ranking.sort((a, b) => b.pontos - a.pontos);
    } catch {
      return [];  // Retorna array vazio em caso de erro
    }
  }

  // ===================================================================================
  // MÉTODOS PRIVADOS - UTILITÁRIOS INTERNOS
  // ===================================================================================

  /**
   * ADICIONA PONTOS AO RANKING DE UM USUÁRIO
   *
   * Método interno chamado automaticamente quando um registro é validado.
   * Se o usuário já existe no ranking, incrementa seus pontos.
   * Se é novo, cria uma nova entrada com os pontos iniciais.
   *
   * @param email - Email do usuário que ganhou pontos
   * @param pontos - Quantidade de pontos a adicionar
   * @private
   */
  private adicionarPontos(email: string, pontos: number): void {
    const ranking = this.getRanking();  // Recupera ranking atual
    const entry = ranking.find(r => r.email === email);  // Busca entrada do usuário

    if (entry) {
      entry.pontos += pontos;  // Incrementa pontos se usuário já existe
    } else {
      ranking.push({ email, pontos });  // Cria nova entrada se é usuário novo
    }

    // Salva ranking atualizado no localStorage
    localStorage.setItem(this.rankingKey, JSON.stringify(ranking));
  }

  /**
   * SALVA A LISTA DE REGISTROS NO LOCALSTORAGE
   *
   * Método utilitário para persistir alterações nos registros.
   * Converte o array para JSON e armazena no localStorage.
   *
   * @param registros - Array completo de registros a salvar
   * @private
   */
  private salvarRegistros(registros: RegistroDescarte[]): void {
    localStorage.setItem(this.registrosKey, JSON.stringify(registros));
  }
}
