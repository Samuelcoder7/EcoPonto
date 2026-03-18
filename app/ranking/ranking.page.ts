// =====================================================================================
// PÁGINA RANKING - CLASSIFICAÇÃO E HISTÓRICO DE DESCARTES
// =====================================================================================
// Responsável por exibir o ranking geral de usuários, itens pendentes para validação
// e histórico individual de descartes.
// =====================================================================================

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { RankingService, RankingEntry, RegistroDescarte } from '../services/ranking.service';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon
  ]
})
export class RankingPage implements OnInit {
  ranking: RankingEntry[] = [];
  pendentes: RegistroDescarte[] = [];
  meusRegistros: RegistroDescarte[] = [];
  isAdmin = false;

  private rankingService = inject(RankingService);
  private usuarioService = inject(UsuarioService);

  ngOnInit(): void {
    this.carregar();
  }

  ionViewWillEnter(): void {
    this.carregar();
  }

  validarRegistro(id: string): void {
    const sucesso = this.rankingService.validarRegistro(id);
    if (sucesso) {
      this.carregar();
    }
  }

  private carregar(): void {
    this.ranking = this.rankingService.getRanking();
    this.pendentes = this.rankingService.getRegistrosPendentes();
    const usuario = this.usuarioService.getUsuarioLogado();
    this.isAdmin = usuario?.tipo === 'admin';
    this.meusRegistros = usuario ? this.rankingService.getRegistrosPorUsuario(usuario.email) : [];
  }
}
