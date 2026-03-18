// =====================================================================================
// SERVIÇO DE USUÁRIO - GERENCIAMENTO DE AUTENTICAÇÃO E DADOS DE USUÁRIOS
// =====================================================================================
// Este serviço gerencia todas as operações relacionadas aos usuários do aplicativo:
// - Cadastro de novos usuários
// - Login/logout de usuários
// - Persistência de dados no localStorage (simulando um banco de dados)
// - Validação de autenticação
//
// IMPORTANTE: Em produção, isso seria substituído por chamadas de API REST para um backend
// =====================================================================================

import { Injectable } from '@angular/core';

// =====================================================================================
// INTERFACE USUARIO - DEFINE A ESTRUTURA DOS DADOS DO USUÁRIO
// =====================================================================================
export interface Usuario {
  nome: string;                    // Nome completo do usuário
  anoNascimento: string;          // Data de nascimento no formato "YYYY-MM" (ISO string)
  telefone: string;               // Número de telefone com formatação
  email: string;                  // Email único do usuário (usado como identificador)
  senha: string;                  // Senha do usuário (em produção seria hashada)
  tipo?: 'usuario' | 'admin';      // Tipo do usuário: usuario comum ou administrador (definido automaticamente)
}

// =====================================================================================
// SERVIÇO PRINCIPAL - LÓGICA DE NEGÓCIO PARA USUÁRIOS
// =====================================================================================
// Nomes dos administradores fixos do sistema (modo local)
const ADMINS: string[] = [
  'Beatriz Freitas',
  'Samuel Valentim',
  'Gabriel Suliano'
];

@Injectable({
  providedIn: 'root'  // Serviço singleton disponível em toda a aplicação
})
export class UsuarioService {
  // ===================================================================================
  // PROPRIEDADES PRIVADAS - ARMAZENAMENTO INTERNO
  // ===================================================================================
  private usuarios: Usuario[] = [];           // Array com todos os usuários cadastrados
  private usuarioLogado: Usuario | null = null; // Usuário atualmente logado (null se não logado)

  // ===================================================================================
  // CONSTRUTOR - INICIALIZAÇÃO DO SERVIÇO
  // ===================================================================================
  constructor() {
    this.carregarUsuarios();  // Carrega usuários salvos no localStorage ao iniciar
  }

  // ===================================================================================
  // MÉTODO PRIVADO - CARREGAR USUÁRIOS DO LOCALSTORAGE
  // ===================================================================================
  // Carrega os dados dos usuários salvos no navegador
  // Simula a leitura de um banco de dados
  private carregarUsuarios(): void {
    const dados = localStorage.getItem('usuarios');
    if (dados) {
      const lista = JSON.parse(dados) as Usuario[];
      // Garante retrocompatibilidade: usuários sem tipo recebem 'usuario'
      this.usuarios = lista.map(u => ({ ...u, tipo: u.tipo ?? 'usuario' }));
    }
  }

  // ===================================================================================
  // MÉTODO PRIVADO - SALVAR USUÁRIOS NO LOCALSTORAGE
  // ===================================================================================
  // Persiste os dados dos usuários no navegador
  // Simula a escrita em um banco de dados
  private salvarUsuarios(): void {
    localStorage.setItem('usuarios', JSON.stringify(this.usuarios));
  }

  // ===================================================================================
  // MÉTODO PÚBLICO - SALVAR NOVO USUÁRIO
  // ===================================================================================
  // Adiciona um novo usuário ao sistema
  // Retorna true se conseguiu salvar, false se email já existe
  salvarUsuario(usuario: Usuario): boolean {
    // Verificar se email já existe (evitar duplicatas)
    const existe = this.usuarios.find(u => u.email === usuario.email);
    if (existe) {
      return false;  // Email já cadastrado
    }

    // Garante tipo padrão para usuários novos
    if (!usuario.tipo) {
      usuario.tipo = ADMINS.includes(usuario.nome.trim()) ? 'admin' : 'usuario';
    }

    // Adicionar usuário ao array e salvar
    this.usuarios.push(usuario);
    this.salvarUsuarios();
    return true;  // Sucesso
  }

  // ===================================================================================
  // MÉTODO PÚBLICO - OBTER USUÁRIO LOGADO
  // ===================================================================================
  // Retorna o usuário atualmente logado ou null se ninguém estiver logado
  getUsuarioLogado(): Usuario | null {
    return this.usuarioLogado;
  }

  // ===================================================================================
  // MÉTODO PÚBLICO - DEFINIR USUÁRIO LOGADO
  // ===================================================================================
  // Define qual usuário está logado no sistema
  // Salva o email no localStorage para persistir entre sessões
  setUsuarioLogado(email: string): void {
    const usuario = this.usuarios.find(u => u.email === email);
    this.usuarioLogado = usuario || null;
    if (usuario) {
      localStorage.setItem('usuarioLogado', email);
    }
  }

  // ===================================================================================
  // MÉTODO PÚBLICO - FAZER LOGIN
  // ===================================================================================
  // Autentica um usuário com email e senha
  // Retorna true se login bem-sucedido, false caso contrário
  login(email: string, senha: string): boolean {
    const usuario = this.usuarios.find(u => u.email === email && u.senha === senha);
    if (usuario) {
      this.usuarioLogado = usuario;
      localStorage.setItem('usuarioLogado', email);  // Persistir login
      return true;
    }
    return false;
  }

  // ===================================================================================
  // MÉTODO PÚBLICO - FAZER LOGOUT
  // ===================================================================================
  // Desconecta o usuário atual do sistema
  // Remove dados de sessão do localStorage
  logout(): void {
    this.usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
  }

  // ===================================================================================
  // MÉTODO PÚBLICO - VERIFICAR LOGIN AUTOMÁTICO
  // ===================================================================================
  // Verifica se há um usuário logado salvo no localStorage
  // Útil para manter o usuário logado entre sessões do navegador
  verificarLogin(): boolean {
    const email = localStorage.getItem('usuarioLogado');
    if (email) {
      const usuario = this.usuarios.find(u => u.email === email);
      this.usuarioLogado = usuario || null;
      return !!usuario;
    }
    return false;
  }
}

// =====================================================================================
// NOTAS DE IMPLEMENTAÇÃO:
// =====================================================================================
// 1. LOCALSTORAGE: Usado para simular persistência de dados. Em produção, seria API REST
// 2. SENHAS: Não são hasheadas. Em produção, usar bcrypt ou similar
// 3. AUTENTICAÇÃO: Simples baseada em email/senha. Em produção, usar JWT ou OAuth
// 4. VALIDAÇÃO: Não há validação de email/telefone. Em produção, implementar validações
// 5. SEGURANÇA: Dados sensíveis não são criptografados. Em produção, usar HTTPS + criptografia
// =====================================================================================