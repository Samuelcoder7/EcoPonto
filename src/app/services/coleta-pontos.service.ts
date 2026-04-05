// =====================================================================================
// SERVIÇO DE PONTOS DE COLETA - GERENCIAMENTO DE ECOPONTOS E LOCALIZAÇÃO
// =====================================================================================
// Este serviço gerencia todos os pontos de coleta de lixo e recicláveis:
// - Lista de ecopontos disponíveis
// - Geocodificação de endereços (conversão endereço -> coordenadas GPS)
// - Cache de coordenadas para performance
// - Integração com Google Maps API
//
// IMPORTANTE: Em produção, os dados viriam de uma API REST do backend
// =====================================================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// =====================================================================================
// TIPOS E INTERFACES - DEFINIÇÃO DE DADOS
// =====================================================================================

// Tipo para categorizar os pontos de coleta
export type TipoColeta = 'reciclavel' | 'lixo';

// Interface principal para pontos de coleta
export interface PontoColeta {
  id: string;           // Identificador único do ponto
  nome: string;         // Nome descritivo do ecoponto
  tipo: TipoColeta;     // Tipo: reciclável ou lixo comum
  bairro: string;       // Bairro onde está localizado
  endereco: string;     // Endereço completo
  lat?: number;         // Latitude (coordenada GPS) - opcional até ser geocodificada
  lng?: number;         // Longitude (coordenada GPS) - opcional até ser geocodificada
  avaliacao?: number;   // Avaliação do usuário (1-5 estrelas) - opcional
}

// =====================================================================================
// SERVIÇO PRINCIPAL - LÓGICA DE NEGÓCIO PARA PONTOS DE COLETA
// =====================================================================================
@Injectable({
  providedIn: 'root'  // Serviço singleton disponível em toda a aplicação
})
export class ColetaPontosService {
  private apiBaseUrl = environment.apiBaseUrl;
  // ===================================================================================
  // PROPRIEDADES PRIVADAS - CONFIGURAÇÃO E CACHE
  // ===================================================================================
  private cacheKey = 'coletaPontosCoords';  // Chave para cache no localStorage

  // ===================================================================================
  // DADOS DOS PONTOS DE COLETA - SIMULAÇÃO DE BANCO DE DADOS
  // ===================================================================================
  // Em produção, esses dados viriam de uma API REST
  // Contém pontos de coleta reais do Rio de Janeiro
  private pontosFallback: PontoColeta[] = [
    {
      id: 'cg-01',
      nome: 'Ecoponto Campo Grande',
      tipo: 'lixo',
      bairro: 'Campo Grande',
      endereco: 'Avenida Maria Teresa, Campo Grande, Rio de Janeiro, RJ',
      avaliacao: 4.8,
      lat: -22.9051459,
      lng: -43.5658115
    },
    {
      id: 'cg-02',
      nome: 'Ecoponto Campo Grande (Reciclavel)',
      tipo: 'reciclavel',
      bairro: 'Campo Grande',
      endereco: 'Avenida Maria Teresa, Campo Grande, Rio de Janeiro, RJ',
      avaliacao: 4.8,
      lat: -22.9051459,
      lng: -43.5658115
    },
    {
      id: 'bg-01',
      nome: 'Ecoponto Catiri',
      tipo: 'lixo',
      bairro: 'Bangu',
      endereco: 'Catiri, Bangu, Rio de Janeiro, RJ',
      avaliacao: 4.8,
      lat: -22.853089,
      lng: -43.468768
    },
    {
      id: 'bg-03',
      nome: 'Ecoponto Reciclavel Bangu Shopping',
      tipo: 'reciclavel',
      bairro: 'Bangu',
      endereco: 'Rua Fonseca, 240 - Bangu, Rio de Janeiro - RJ',
      avaliacao: 4.8,
      lat: -22.862822,
      lng: -43.49097
    }
  ];

  constructor(private http: HttpClient) {}

  // ===================================================================================
  // MÉTODOS PÚBLICOS - API DO SERVIÇO
  // ===================================================================================

  /**
   * RETORNA TODOS OS PONTOS DE COLETA COM COORDENADAS ATUALIZADAS
   *
   * Este método é o principal ponto de entrada para obter dados dos ecopontos.
   * Ele combina os dados estáticos dos pontos com as coordenadas geocodificadas
   * armazenadas em cache (localStorage).
   *
   * Processo:
   * 1. Recupera o cache de coordenadas do localStorage
   * 2. Para cada ponto, mescla com coordenadas do cache se disponíveis
   * 3. Retorna array completo com dados atualizados
   *
   * @returns Array de pontos de coleta com coordenadas (se disponíveis)
   */
  async getPontos(): Promise<PontoColeta[]> {
    let pontos: PontoColeta[] = [];
    try {
      pontos = await firstValueFrom(
        this.http.get<PontoColeta[]>(`${this.apiBaseUrl}/api/pontos-coleta`)
      );
    } catch {
      pontos = this.pontosFallback;
    }

    const cache = this.getCache();  // Recupera coordenadas em cache
    return pontos.map(ponto => {
      const coord = cache[ponto.id];  // Busca coordenadas para este ponto
      if (!coord) {
        return { ...ponto };  // Retorna ponto sem coordenadas se não houver cache
      }
      // Mescla ponto original com coordenadas do cache
      return { ...ponto, lat: coord.lat ?? ponto.lat, lng: coord.lng ?? ponto.lng };
    });
  }

  /**
   * ATUALIZA AS COORDENADAS DE UM PONTO DE COLETA NO CACHE
   *
   * Este método é chamado após geocodificar um endereço via Google Maps API.
   * As coordenadas são armazenadas em localStorage para evitar chamadas repetidas
   * à API de geocodificação, melhorando performance e reduzindo custos.
   *
   * @param id - Identificador único do ponto de coleta
   * @param lat - Latitude da coordenada GPS
   * @param lng - Longitude da coordenada GPS
   */
  atualizarCoordenadas(id: string, lat: number, lng: number): void {
    const cache = this.getCache();  // Recupera cache atual
    cache[id] = { lat, lng };       // Adiciona/atualiza coordenadas
    localStorage.setItem(this.cacheKey, JSON.stringify(cache));  // Salva no localStorage
  }

  // ===================================================================================
  // MÉTODOS PRIVADOS - UTILITÁRIOS INTERNOS
  // ===================================================================================

  /**
   * RECUPERA O CACHE DE COORDENADAS DO LOCALSTORAGE
   *
   * Método utilitário para recuperar as coordenadas geocodificadas armazenadas.
   * Inclui tratamento de erros para casos onde o localStorage está corrompido
   * ou vazio.
   *
   * @returns Objeto com coordenadas indexadas por ID do ponto
   * @private
   */
  private getCache(): Record<string, { lat: number; lng: number }> {
    const dados = localStorage.getItem(this.cacheKey);  // Tenta recuperar do localStorage
    if (!dados) {
      return {};  // Retorna objeto vazio se não houver dados
    }
    try {
      // Faz parse do JSON e valida o tipo
      return JSON.parse(dados) as Record<string, { lat: number; lng: number }>;
    } catch {
      // Em caso de erro no parse (JSON inválido), retorna objeto vazio
      return {};
    }
  }
}

