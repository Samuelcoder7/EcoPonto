// =====================================================================================
// PÁGINA PAINEL - NAVEGAÇÃO E AÇÕES DO PERFIL
// =====================================================================================
// Responsável por centralizar ações rápidas do usuário autenticado e servir como
// ponto de navegação para recursos principais do aplicativo.
// =====================================================================================

import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-painel',
  templateUrl: './painel.page.html',
  styleUrls: ['./painel.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon,
  ]
})
export class PainelPage {
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);

  irParaColeta(): void {
    this.router.navigateByUrl('/coleta');
  }

  irParaSobre(): void {
    this.router.navigateByUrl('/sobre');
  }

  irParaRanking(): void {
    this.router.navigateByUrl('/ranking');
  }

  sair(): void {
    this.usuarioService.logout();
    this.router.navigateByUrl('/login');
  }
}
