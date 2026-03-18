// =====================================================================================
// PÁGINA LOGIN - AUTENTICAÇÃO DE USUÁRIOS
// =====================================================================================
// Responsável por autenticar usuários existentes, validar credenciais e direcionar
// para o fluxo principal da aplicação.
// =====================================================================================

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonText,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonNote, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonFabButton, IonFab, 
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
    IonText,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon,
    FormsModule
  ],
  standalone: true
})
export class LoginPage {
  email = '';
  senha = '';

  mostrarAlerta = false;
  mensagemAlerta = '';
  tipoAlerta = 'danger';
  carregando = true;
  processando = false;
  usuarioLogado = false;

  alertButtons = [
    {
      text: 'OK',
      handler: () => this.fecharAlertaCallback()
    }
  ];

  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  ngOnInit(): void {
    // Simular carregamento inicial
    setTimeout(() => {
      this.carregando = false;
    }, 1000);
    // Verificar se usuário está logado
    this.usuarioLogado = !!this.usuarioService.getUsuarioLogado();
  }

  validarFormulario(): boolean {
    if (!this.email || !this.senha) {
      this.mostrarMensagem('Por favor, preencha todos os campos.', 'danger');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.mostrarMensagem('Por favor, informe um e-mail válido.', 'danger');
      return false;
    }

    return true;
  }

  mostrarMensagem(mensagem: string, tipo: string): void {
    this.mensagemAlerta = mensagem;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  async fazerLogin(): Promise<void> {
    if (!this.validarFormulario() || this.processando) {
      return;
    }

    this.processando = true;

    try {
      // Simular delay de processamento
      await this.delay(1000);

      const loginValido = this.usuarioService.login(this.email, this.senha);

      if (loginValido) {
        this.limparFormulario();
        await this.router.navigateByUrl('/painel');
        return;
      } else {
        this.mostrarMensagem('Email ou senha incorretos.', 'danger');
      }
    } catch (error) {
      this.mostrarMensagem('Erro ao fazer login. Tente novamente.', 'danger');
    } finally {
      this.processando = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  limparFormulario(): void {
    this.email = '';
    this.senha = '';
  }

  irParaCadastro(): void {
    this.router.navigateByUrl('/cadastro');
  }

  fecharAlerta(): void {
    this.mostrarAlerta = false;
  }

  fecharAlertaCallback(): void {
    this.mostrarAlerta = false;
  }
}

