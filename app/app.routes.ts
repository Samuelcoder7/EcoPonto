// =====================================================================================
// CONFIGURAÇÃO DE ROTAS DA APLICAÇÃO - ANGULAR ROUTER
// =====================================================================================
// Este arquivo define todas as rotas da aplicação e seus guards de proteção.
// Usa lazy loading para carregar componentes apenas quando necessário,
// melhorando performance e tempo de inicialização.
//
// SISTEMA DE AUTENTICAÇÃO:
// - authGuard: Protege rotas que requerem usuário logado
// - guestGuard: Protege rotas de visitantes (login/cadastro)
//
// ESTRUTURA DE ROTAS:
// - Rotas públicas: login, cadastro (apenas para visitantes)
// - Rotas protegidas: home, coleta, ranking, painel (requerem login)
// =====================================================================================

import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { UsuarioService } from './services/usuario.service';

// =====================================================================================
// GUARDS DE AUTENTICAÇÃO - CONTROLE DE ACESSO ÀS ROTAS
// =====================================================================================

/**
 * GUARD DE AUTENTICAÇÃO - PROTEGE ROTAS QUE REQUEREM LOGIN
 *
 * Este guard verifica se o usuário está logado antes de permitir acesso
 * às rotas protegidas. Se não estiver logado, redireciona para /login.
 *
 * Funcionamento:
 * 1. Injeta o UsuarioService
 * 2. Verifica se há usuário logado
 * 3. Retorna true (permite acesso) ou array com rota de redirecionamento
 *
 * @returns true se usuário logado, ['/login'] caso contrário
 */
const authGuard = () => {
  const usuarioService = inject(UsuarioService);  // Injeção de dependência
  return usuarioService.getUsuarioLogado() ? true : ['/login'];  // Verificação e redirecionamento
};

/**
 * GUARD DE VISITANTES - PROTEGE ROTAS DE USUÁRIOS LOGADOS
 *
 * Este guard impede que usuários já logados acessem páginas de login/cadastro.
 * Se o usuário estiver logado, redireciona para /home.
 *
 * Funcionamento:
 * 1. Injeta o UsuarioService
 * 2. Verifica se há usuário logado
 * 3. Retorna true (permite acesso) ou array com rota de redirecionamento
 *
 * @returns true se não há usuário logado, ['/home'] caso contrário
 */
const guestGuard = () => {
  const usuarioService = inject(UsuarioService);  // Injeção de dependência
  return usuarioService.getUsuarioLogado() ? ['/home'] : true;  // Verificação e redirecionamento
};

// =====================================================================================
// DEFINIÇÃO DAS ROTAS - CONFIGURAÇÃO PRINCIPAL
// =====================================================================================
export const routes: Routes = [
  // ===================================================================================
  // ROTA HOME - PÁGINA PRINCIPAL (PROTEGIDA)
  // ===================================================================================
  {
    path: 'home',  // URL: /home
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),  // Lazy loading
    canActivate: [authGuard],  // Requer usuário logado
  },

  // ===================================================================================
  // ROTA RAIZ - REDIRECIONAMENTO AUTOMÁTICO
  // ===================================================================================
  {
    path: '',  // URL raiz: /
    redirectTo: 'login',  // Redireciona para login
    pathMatch: 'full',  // Match completo da URL
  },

  // ===================================================================================
  // ROTAS DE AUTENTICAÇÃO - APENAS PARA VISITANTES
  // ===================================================================================
  {
    path: 'cadastro',  // URL: /cadastro
    loadComponent: () => import('./cadastro/cadastro.page').then( m => m.CadastroPage),  // Lazy loading
    canActivate: [guestGuard],  // Apenas para usuários não logados
  },
  {
    path: 'login',  // URL: /login
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage),  // Lazy loading
    canActivate: [guestGuard],  // Apenas para usuários não logados
  },

  // ===================================================================================
  // ROTAS FUNCIONAIS - REQUEREM AUTENTICAÇÃO
  // ===================================================================================
  {
    path: 'coleta',  // URL: /coleta - Página de registro de descarte
    loadComponent: () => import('./coleta/coleta.page').then( m => m.ColetaPage),  // Lazy loading
    canActivate: [authGuard],  // Requer usuário logado
  },
  {
    path: 'ranking',  // URL: /ranking - Página de ranking de usuários
    loadComponent: () => import('./ranking/ranking.page').then( m => m.RankingPage),  // Lazy loading
    canActivate: [authGuard],  // Requer usuário logado
  },
  {
    path: 'painel',  // URL: /painel - Painel administrativo
    loadComponent: () => import('./painel/painel.page').then( m => m.PainelPage),  // Lazy loading
    canActivate: [authGuard],  // Requer usuário logado
  },
  {
    path: 'sobre',  // URL: /sobre - Informações sobre a aplicação
    loadComponent: () => import('./sobre/sobre.page').then( m => m.SobrePage),  // Lazy loading
    canActivate: [authGuard],  // Requer usuário logado
  },
];
