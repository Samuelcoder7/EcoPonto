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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { GoogleMap } from '@capacitor/google-maps';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ColetaPontosService, PontoColeta } from '../services/coleta-pontos.service';
import { RankingService } from '../services/ranking.service';
import { UsuarioService } from '../services/usuario.service';

const GOOGLE_GEOCODING_API_KEY = 'AIzaSyD-lFCYNdPjfaGQKLGCw99_NDDjsiPJEak';
const DEFAULT_WEB_MARKER_ICON = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
const SELECTED_WEB_MARKER_ICON = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';

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
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSkeletonText,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonIcon,
    GoogleMapsModule
  ]
})
export class ColetaPage implements AfterViewInit {
  @ViewChild('map', { static: false }) mapRef!: ElementRef<HTMLElement>;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  pontos: PontoColeta[] = [];
  pontosDistanciaKm: Record<string, number> = {};
  selectedPontoId: string | null = null;
  filtroTipo: 'todos' | 'reciclavel' | 'lixo' = 'todos';
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
  private markerIds: string[] = [];
  private markerPontoIdByMarkerId: Record<string, string> = {};
  private coletaService = inject(ColetaPontosService);
  private rankingService = inject(RankingService);
  private usuarioService = inject(UsuarioService);

  webMapCenter: google.maps.LatLngLiteral = { lat: -22.9019, lng: -43.5596 };
  webMapZoom = 12;
  webMapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  };
  infoWindowData: { titulo: string; endereco: string; tipo: string; distancia: string } | null = null;

  constructor() {}

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
    await this.renderMarkers();

    await this.map.setOnMarkerClickListener(event => {
      const pontoId = this.markerPontoIdByMarkerId[event.markerId];
      const ponto = this.pontos.find(item => item.id === pontoId);
      if (ponto) {
        this.selecionarPonto(ponto, true);
      }
    });

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
    this.pontos = await this.coletaService.getPontos();
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
    await this.atualizarLocalizacaoUsuario();
    if (!this.isNative) {
      const primeiro = this.pontosFiltrados.find(ponto => ponto.lat !== undefined && ponto.lng !== undefined);
      if (primeiro) {
        this.webMapCenter = { lat: primeiro.lat as number, lng: primeiro.lng as number };
      }
    }
    await this.renderMarkers();
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

  selecionarPonto(ponto: PontoColeta, origemMapa = false): void {
    this.selectedPontoId = ponto.id;
    this.mostrarMensagem(`Selecionado: ${ponto.nome}`, 'success');
    if (this.map && ponto.lat !== undefined && ponto.lng !== undefined) {
      this.map.setCamera({
        coordinate: { lat: ponto.lat as number, lng: ponto.lng as number },
        zoom: origemMapa ? 14 : 13
      });
      this.renderMarkers();
    } else if (!this.isNative && ponto.lat !== undefined && ponto.lng !== undefined) {
      this.webMapCenter = { lat: ponto.lat as number, lng: ponto.lng as number };
      this.webMapZoom = origemMapa ? 15 : 13;
    }
  }

  abrirInfoWindow(marker: MapMarker, ponto: PontoColeta): void {
    this.selecionarPonto(ponto, true);
    this.infoWindowData = {
      titulo: ponto.nome,
      endereco: ponto.endereco,
      tipo: ponto.tipo === 'reciclavel' ? 'Reciclável' : 'Lixo',
      distancia: this.getDistanceLabel(ponto)
    };
    this.infoWindow.open(marker);
  }

  get pontosFiltrados(): PontoColeta[] {
    if (this.filtroTipo === 'todos') return this.pontos;
    return this.pontos.filter(ponto => ponto.tipo === this.filtroTipo);
  }

  getDistanceLabel(ponto: PontoColeta): string {
    const km = this.pontosDistanciaKm[ponto.id];
    if (km === undefined) return 'Distância indisponível';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }

  onFiltroTipoChange(value: unknown): void {
    const permitido = value === 'todos' || value === 'reciclavel' || value === 'lixo';
    this.filtroTipo = permitido ? value : 'todos';
    if (!this.isNative) {
      const primeiro = this.pontosFiltrados.find(ponto => ponto.lat !== undefined && ponto.lng !== undefined);
      if (primeiro) {
        this.webMapCenter = { lat: primeiro.lat as number, lng: primeiro.lng as number };
        this.webMapZoom = 13;
      }
    }
    this.renderMarkers();
  }

  getMarkerPosition(ponto: PontoColeta): google.maps.LatLngLiteral | null {
    if (ponto.lat === undefined || ponto.lng === undefined) return null;
    return { lat: ponto.lat, lng: ponto.lng };
  }

  private async atualizarLocalizacaoUsuario(): Promise<void> {
    try {
      const posicao = await Geolocation.getCurrentPosition();
      const origem = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
      const distancias: Record<string, number> = {};
      for (const ponto of this.pontos) {
        if (ponto.lat === undefined || ponto.lng === undefined) continue;
        distancias[ponto.id] = this.haversineKm(origem.lat, origem.lng, ponto.lat, ponto.lng);
      }
      this.pontosDistanciaKm = distancias;
    } catch {
      this.pontosDistanciaKm = {};
    }
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const r = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return r * c;
  }

  getWebMarkerOptions(ponto: PontoColeta): google.maps.MarkerOptions {
    return {
      icon: ponto.id === this.selectedPontoId ? SELECTED_WEB_MARKER_ICON : DEFAULT_WEB_MARKER_ICON
    };
  }

  private async renderMarkers(): Promise<void> {
    if (!this.map) return;

    if (this.markerIds.length > 0) {
      await this.map.removeMarkers(this.markerIds);
      this.markerIds = [];
      this.markerPontoIdByMarkerId = {};
    }

    const pontosComCoords = this.pontosFiltrados.filter(
      ponto => ponto.lat !== undefined && ponto.lng !== undefined
    );
    if (pontosComCoords.length === 0) return;

    const markerDefs = pontosComCoords.map(ponto => ({
      coordinate: {
        lat: ponto.lat as number,
        lng: ponto.lng as number
      },
      title: ponto.nome,
      snippet: `${ponto.endereco} - ${ponto.tipo === 'reciclavel' ? 'Reciclável' : 'Lixo'}`,
      tintColor:
        ponto.id === this.selectedPontoId
          ? { r: 255, g: 145, b: 0, a: 255 }
          : { r: 15, g: 157, b: 88, a: 255 }
    }));

    const ids = await this.map.addMarkers(markerDefs);
    this.markerIds = ids;
    ids.forEach((id, index) => {
      this.markerPontoIdByMarkerId[id] = pontosComCoords[index].id;
    });
  }

  private fecharAlerta(): void {
    this.mostrarAlerta = false;
  }
}
