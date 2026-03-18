// =====================================================================================
// PÁGINA COLETA - MAPA, GEOLOCALIZAÇÃO E REGISTRO DE DESCARTE
// =====================================================================================
// Responsável por exibir ecopontos no mapa, capturar foto/localização do descarte
// e registrar ações para validação e pontuação no ranking.
// =====================================================================================

import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { GoogleMap } from '@capacitor/google-maps';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ColetaPontosService, PontoColeta } from '../services/coleta-pontos.service';
import { RankingService } from '../services/ranking.service';
import { UsuarioService } from '../services/usuario.service';

const GOOGLE_GEOCODING_API_KEY = 'AIzaSyD-lFCYNdPjfaGQKLGCw99_NDDjsiPJEak';

@Component({
  selector: 'app-coleta',
  templateUrl: './coleta.page.html',
  styleUrls: ['./coleta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonAlert,
    IonBadge,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonSearchbar,
    IonSkeletonText,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon
  ]
})
export class ColetaPage implements AfterViewInit {
  @ViewChild('map', { static: false }) mapRef!: ElementRef<HTMLElement>;

  pontos: PontoColeta[] = [];
  isNative = Capacitor.isNativePlatform();
  mostrarAlerta = false;
  mensagemAlerta = '';
  mensagemMapa = '';
  tipoAlerta: 'success' | 'danger' = 'success';
  carregando = true; // Adicionado para mostrar loading

  alertButtons = [
    {
      text: 'OK',
      handler: () => this.fecharAlerta()
    }
  ];

  private map?: GoogleMap;
  private coletaService = inject(ColetaPontosService);
  private rankingService = inject(RankingService);
  private usuarioService = inject(UsuarioService);

  constructor() {
    this.pontos = this.coletaService.getPontos();
  }

  async ngAfterViewInit(): Promise<void> {
    this.carregando = true;
    await this.carregarPontos();
    if (this.isNative) {
      try {
        await this.criarMapa();
      } catch (error) {
        this.mensagemMapa = 'Não foi possível carregar o mapa no dispositivo. Verifique chave da API, permissões e internet.';
        console.error('Falha ao inicializar Google Maps nativo:', error);
        this.mostrarMensagem(this.mensagemMapa, 'danger');
      }
    }
    // Simular carregamento
    setTimeout(() => {
      this.carregando = false;
    }, 1500);
  }

  async registrarDescarte(): Promise<void> {
    const usuario = this.usuarioService.getUsuarioLogado();
    if (!usuario) {
      this.mostrarMensagem('Faça login para registrar o descarte.', 'danger');
      return;
    }

    try {
      const foto = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (!foto.dataUrl) {
        this.mostrarMensagem('Foto não capturada.', 'danger');
        return;
      }

      const posicao = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = posicao.coords;

      this.rankingService.registrarDescarte(usuario.email, foto.dataUrl, latitude, longitude);
      this.mostrarMensagem('Registro enviado. Aguarde validação.', 'success');
    } catch {
      this.mostrarMensagem('Não foi possível acessar câmera ou localização.', 'danger');
    }
  }

  private async criarMapa(): Promise<void> {
    if (!this.mapRef?.nativeElement) {
      return;
    }

    const centroPadrao = { lat: -22.9019, lng: -43.5596 };

    this.map = await GoogleMap.create({
      id: 'coleta-map',
      element: this.mapRef.nativeElement,
      apiKey: GOOGLE_GEOCODING_API_KEY,
      config: {
        center: centroPadrao,
        zoom: 12
      }
    });

    const pontosComCoords = this.pontos.filter(ponto => ponto.lat !== undefined && ponto.lng !== undefined);
    if (pontosComCoords.length > 0) {
      await this.map.addMarkers(
        pontosComCoords.map(ponto => ({
          coordinate: {
            lat: ponto.lat as number,
            lng: ponto.lng as number
          },
          title: ponto.nome,
          snippet: `${ponto.endereco} - ${ponto.tipo === 'reciclavel' ? 'Reciclável' : 'Lixo'}`
        }))
      );
    }

    try {
      const posicao = await Geolocation.getCurrentPosition();
      await this.map.setCamera({
        coordinate: {
          lat: posicao.coords.latitude,
          lng: posicao.coords.longitude
        },
        zoom: 13
      });
    } catch {
      // ignora se não tiver permissão de localização
    }
  }

  private async carregarPontos(): Promise<void> {
    const pontosAtualizados: PontoColeta[] = [];
    for (const ponto of this.pontos) {
      if (ponto.lat !== undefined && ponto.lng !== undefined) {
        pontosAtualizados.push(ponto);
        continue;
      }

      const coords = await this.geocodeEndereco(ponto.endereco);
      if (coords) {
        this.coletaService.atualizarCoordenadas(ponto.id, coords.lat, coords.lng);
        pontosAtualizados.push({ ...ponto, ...coords });
      } else {
        pontosAtualizados.push(ponto);
      }
    }
    this.pontos = pontosAtualizados;
  }

  private async geocodeEndereco(endereco: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        endereco
      )}&key=${GOOGLE_GEOCODING_API_KEY}`;
      const resposta = await fetch(url);
      if (!resposta.ok) {
        return null;
      }
      const dados = (await resposta.json()) as {
        status: string;
        results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
      };
      if (dados.status !== 'OK' || dados.results.length === 0) {
        return null;
      }
      return dados.results[0].geometry.location;
    } catch {
      return null;
    }
  }

  private mostrarMensagem(mensagem: string, tipo: 'success' | 'danger'): void {
    this.mensagemAlerta = mensagem;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  selecionarPonto(ponto: PontoColeta): void {
    // TODO: implementar navegação para detalhes do ponto ou abrir modal
    this.mostrarMensagem(`Selecionado: ${ponto.nome}`, 'success');
  }

  private fecharAlerta(): void {
    this.mostrarAlerta = false;
  }
}
