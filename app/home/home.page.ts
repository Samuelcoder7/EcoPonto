// =====================================================================================
// PÁGINA HOME - DASHBOARD PRINCIPAL DO USUÁRIO
// =====================================================================================
// Responsável por apresentar visão geral do usuário, acesso rápido às funcionalidades
// e listagem de pontos de coleta próximos.
// =====================================================================================

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge
} from '@ionic/angular/standalone';
import { ColetaPontosService, PontoColeta } from '../services/coleta-pontos.service';
import { UsuarioService, Usuario } from '../services/usuario.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonBadge
  ],
  standalone: true
})
export class HomePage {
  private router = inject(Router);
  private coletaService = inject(ColetaPontosService);
  private usuarioService = inject(UsuarioService);

  pontos: PontoColeta[] = [];

  usuarioLogado: Usuario | null = null;

  constructor() {
    this.carregarDados();
    this.verificarUsuario();
  }

  carregarDados() {
    this.pontos = this.coletaService.getPontos();
  }

  verificarUsuario() {
    this.usuarioLogado = this.usuarioService.getUsuarioLogado();
  }

  navegarParaColeta() {
    this.router.navigate(['/coleta']);
  }

  navegarParaRanking() {
    this.router.navigate(['/ranking']);
  }

  get saudacao(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  get mensagemBoasVindas(): string {
    if (this.usuarioLogado?.nome) {
      return `${this.saudacao}, ${this.usuarioLogado.nome.split(' ')[0]}!`;
    }
    return `${this.saudacao}!`;
  }
}
