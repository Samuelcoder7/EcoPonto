// =====================================================================================
// PÁGINA DE CADASTRO - REGISTRO DE NOVOS USUÁRIOS
// =====================================================================================
// Esta página gerencia o cadastro de novos usuários no aplicativo EcoApp.
// Inclui validação completa de formulário, UX aprimorada com animações,
// e integração com o serviço de usuários.
//
// FUNCIONALIDADES PRINCIPAIS:
// - Formulário de cadastro com validação em tempo real
// - Formatação automática de telefone
// - Animações e feedback visual
// - Skeleton loading para melhor UX
// - Redirecionamento automático após cadastro
//
// VALIDAÇÕES IMPLEMENTADAS:
// - Nome: obrigatório, 3-100 caracteres
// - Data nascimento: obrigatório, idade 18-120 anos
// - Telefone: obrigatório, formato brasileiro
// - Email: obrigatório, formato válido
// - Senha: obrigatório, 6+ caracteres, maiúscula, minúscula, número
// - Confirmação: deve coincidir com senha
// =====================================================================================

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonAlert,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonNote
} from '@ionic/angular/standalone';
import { UsuarioService, Usuario } from '../services/usuario.service';

// =====================================================================================
// COMPONENTE PRINCIPAL - CADASTRO PAGE
// =====================================================================================
@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  imports: [
    CommonModule,
    IonNote,
    IonAlert,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSkeletonText,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon,
    FormsModule
  ],
  standalone: true
})
export class CadastroPage implements OnInit {
  // ===================================================================================
  // PROPRIEDADES DO FORMULÁRIO - DADOS DE ENTRADA
  // ===================================================================================
  nome = '';
  anoNascimento = ''; // Armazenará "YYYY-MM" via input type=month
  telefone = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  // ===================================================================================
  // PROPRIEDADES DE ESTADO DA UI - CONTROLE VISUAL
  // ===================================================================================
  mostrarAlerta = false;
  mensagemAlerta = '';
  tipoAlerta: 'success' | 'danger' | 'warning' = 'danger';
  carregando = true;        // Skeleton loading inicial
  processando = false;      // Loading durante processamento

  // ===================================================================================
  // PROPRIEDADES DE NAVEGAÇÃO - CONTROLE DE REDIRECIONAMENTO
  // ===================================================================================
  private redirecionarPara: string | null = null;

  // ===================================================================================
  // CONFIGURAÇÃO DO ALERTA - DIÁLOGO DE FEEDBACK
  // ===================================================================================
  alertButtons = [
    {
      text: 'OK',
      role: 'confirm',
      handler: () => this.fecharAlertaCallback()
    }
  ];

  // ===================================================================================
  // SERVIÇOS INJETADOS - DEPENDÊNCIAS
  // ===================================================================================
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // ===================================================================================
  // MÉTODO DO CICLO DE VIDA - INICIALIZAÇÃO
  // ===================================================================================
  ngOnInit(): void {
    this.limparFormulario();
    // Simula carregamento inicial para melhor UX (skeleton loading)
    setTimeout(() => {
      this.carregando = false;
    }, 1200);
  }

  // ===================================================================================
  // VALIDAÇÃO DO FORMULÁRIO - LÓGICA DE NEGÓCIO
  // ===================================================================================

  /**
   * VALIDA TODOS OS CAMPOS DO FORMULÁRIO
   *
   * Executa validações completas em todos os campos do formulário.
   * Retorna objeto com status de validade e lista de erros encontrados.
   *
   * Regras de validação:
   * - Nome: 3-100 caracteres, obrigatório
   * - Data nascimento: formato YYYY-MM, idade 18-120 anos
   * - Telefone: 10-11 dígitos, formato brasileiro
   * - Email: formato válido, obrigatório
   * - Senha: 6+ caracteres, maiúscula, minúscula, número
   * - Confirmação: deve coincidir com senha
   *
   * @returns Objeto com validade e lista de erros
   */
  validarFormulario(): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Nome validation
    // =================================================================================
    // VALIDAÇÃO DO NOME
    // =================================================================================
    if (!this.nome?.trim()) {
      erros.push('O nome é obrigatório.');
    } else if (this.nome.trim().length < 3) {
      erros.push('O nome deve ter pelo menos 3 caracteres.');
    } else if (this.nome.trim().length > 100) {
      erros.push('O nome deve ter no máximo 100 caracteres.');
    }

    // Ano nascimento validation (expect ISO string with month/year)
    // =================================================================================
    // VALIDAÇÃO DA DATA DE NASCIMENTO
    // =================================================================================
    if (!this.anoNascimento) {
      erros.push('A data de nascimento é obrigatória.');
    } else {
      const ano = parseInt(this.anoNascimento.substring(0, 4), 10);
      const mes = parseInt(this.anoNascimento.substring(5, 7), 10);
      const hoje = new Date();
      const data = new Date(ano, mes - 1, 1);
      if (isNaN(ano) || isNaN(mes)) {
        erros.push('Data de nascimento inválida.');
      } else if (ano < 1900) {
        erros.push('O ano de nascimento deve ser maior que 1900.');
      } else if (data > hoje) {
        erros.push('A data de nascimento não pode ser futura.');
      } else {
        const idade = hoje.getFullYear() - ano - (hoje.getMonth() < mes - 1 ? 1 : 0);
        if (idade < 18) {
          erros.push('Você deve ter pelo menos 18 anos para se cadastrar.');
        } else if (idade > 120) {
          erros.push('Por favor, verifique a data de nascimento informada.');
        }
      }
    }

    // Telefone validation
    // =================================================================================
    // VALIDAÇÃO DO TELEFONE
    // =================================================================================
    const telefoneLimpo = this.telefone?.replace(/\D/g, '');
    if (!this.telefone) {
      erros.push('O telefone é obrigatório.');
    } else if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      erros.push('O telefone deve ter 10 ou 11 dígitos (incluindo DDD).');
    }

    // Email validation
    // =================================================================================
    // VALIDAÇÃO DO EMAIL
    // =================================================================================
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.email) {
      erros.push('O e-mail é obrigatório.');
    } else if (!emailRegex.test(this.email)) {
      erros.push('Por favor, informe um e-mail válido.');
    } else if (this.email.length > 255) {
      erros.push('O e-mail deve ter no máximo 255 caracteres.');
    }

    // Senha validation
    // =================================================================================
    // VALIDAÇÃO DA SENHA
    // =================================================================================
    if (!this.senha) {
      erros.push('A senha é obrigatória.');
    } else if (this.senha.length < 6) {
      erros.push('A senha deve ter pelo menos 6 caracteres.');
    } else if (this.senha.length > 50) {
      erros.push('A senha deve ter no máximo 50 caracteres.');
    } else if (!/[A-Z]/.test(this.senha)) {
      erros.push('A senha deve conter pelo menos uma letra maiúscula.');
    } else if (!/[a-z]/.test(this.senha)) {
      erros.push('A senha deve conter pelo menos uma letra minúscula.');
    } else if (!/[0-9]/.test(this.senha)) {
      erros.push('A senha deve conter pelo menos um número.');
    }

    // Confirmar senha validation
    // =================================================================================
    // VALIDAÇÃO DA CONFIRMAÇÃO DE SENHA
    // =================================================================================
    if (!this.confirmarSenha) {
      erros.push('A confirmação de senha é obrigatória.');
    } else if (this.senha !== this.confirmarSenha) {
      erros.push('As senhas não coincidem.');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  // UI feedback methods
  // ===================================================================================
  // MÉTODOS DE FEEDBACK DA UI - INTERAÇÃO COM USUÁRIO
  // ===================================================================================
  mostrarMensagem(mensagem: string, tipo: 'success' | 'danger' | 'warning'): void {
    this.mensagemAlerta = mensagem;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  mostrarMultiplosErros(erros: string[]): void {
    if (erros.length === 1) {
      this.mostrarMensagem(erros[0], 'danger');
    } else if (erros.length > 1) {
      const mensagem = `Por favor, corrija os seguintes erros:\n\n• ${erros.join('\n• ')}`;
      this.mostrarMensagem(mensagem, 'danger');
    }
  }

  // Main action
  // ===================================================================================
  // AÇÃO PRINCIPAL - PROCESSAMENTO DO CADASTRO
  // ===================================================================================
  async cadastrar(): Promise<void> {
    /**
     * PROCESSA O CADASTRO DO USUÁRIO
     *
     * Fluxo completo de cadastro:
     * 1. Previne múltiplos envios simultâneos
     * 2. Valida todos os campos do formulário
     * 3. Cria objeto usuário e salva no serviço
     * 4. Faz login automático e redireciona
     * 5. Trata erros e mostra feedback adequado
     *
     * @returns Promise que resolve quando o cadastro é processado
     */
    // Evitar múltiplos envios
    if (this.processando) return;

    const validacao = this.validarFormulario();

    if (!validacao.valido) {
      this.mostrarMultiplosErros(validacao.erros);
      return;
    }

    this.processando = true;

    try {
      // Simular pequeno delay para melhor UX
      await this.delay(800);

      const novoUsuario: Usuario = {
        nome: this.nome.trim(),
        anoNascimento: this.anoNascimento!,
        telefone: this.telefone.trim(),
        email: this.email.trim().toLowerCase(),
        senha: this.senha // Em produção, a senha deve ser hasheada no backend
      };

      const sucesso = this.usuarioService.salvarUsuario(novoUsuario);

      if (sucesso) {
        this.redirecionarPara = '/painel';
        this.usuarioService.setUsuarioLogado(this.email.trim().toLowerCase());
        this.mostrarMensagem('✅ Cadastro realizado com sucesso!', 'success');
      } else {
        this.mostrarMensagem(
          '❌ Este e-mail já está cadastrado. Por favor, utilize outro e-mail ou faça login.',
          'warning'
        );
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      this.mostrarMensagem(
        '❌ Ocorreu um erro ao processar seu cadastro. Tente novamente.',
        'danger'
      );
    } finally {
      this.processando = false;
    }
  }

  // Utility methods
  // ===================================================================================
  // MÉTODOS UTILITÁRIOS - FUNÇÕES AUXILIARES
  // ===================================================================================
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  limparFormulario(): void {
    this.nome = '';
    this.anoNascimento = '';
    this.telefone = '';
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
  }

  // Alert handling
  // ===================================================================================
  // TRATAMENTO DE ALERTAS - DIÁLOGOS DE FEEDBACK
  // ===================================================================================
  fecharAlertaCallback(): void {
    this.mostrarAlerta = false;

    if (this.redirecionarPara) {
      const destino = this.redirecionarPara;
      this.redirecionarPara = null;

      if (this.tipoAlerta === 'success') {
        this.limparFormulario();
      }

      this.router.navigateByUrl(destino);
    }
  }

}
