// =====================================================================================
// PÁGINA COLETA - MAPA, GEOLOCALIZAÇÃO E REGISTRO DE DESCARTE
// =====================================================================================
// Responsável por exibir ecopontos no mapa, capturar foto/localização do descarte
// e registrar ações para validação e pontuação no ranking.
// =====================================================================================

import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
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
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ColetaPontosService, PontoColeta } from '../services/coleta-pontos.service';
import { RankingService } from '../services/ranking.service';
import { UsuarioService } from '../services/usuario.service';
import { environment } from '../../environments/environment';
import maplibregl from 'maplibre-gl';

const GOOGLE_GEOCODING_API_KEY = 'AIzaSyD-lFCYNdPjfaGQKLGCw99_NDDjsiPJEak';
const GEOAPIFY_MAP_API_KEY = environment.geoapifyApiKey;
const GEOAPIFY_STYLE_URL = `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_MAP_API_KEY}`;
const DEFAULT_WEB_MARKER_COLOR = '#0f9d58';
const SELECTED_WEB_MARKER_COLOR = '#ff9100';

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
    IonIcon
  ]
})
export class ColetaPage implements AfterViewInit, OnDestroy {
  @ViewChild('map', { static: false }) mapRef!: ElementRef<HTMLElement>;
  @ViewChild('webMap', { static: false }) webMapRef!: ElementRef<HTMLElement>;

  pontos: PontoColeta[] = [];
  pontosDistanciaKm: Record<string, number> = {};
  selectedPontoId: string | null = null;
  filtroTipo: 'todos' | 'reciclavel' | 'lixo' = 'todos';
  isNative = Capacitor.isNativePlatform();
  useNativeMap = false;
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
  private userMarkerId?: string;
  private coletaService = inject(ColetaPontosService);
  private rankingService = inject(RankingService);
  private usuarioService = inject(UsuarioService);

  webMapCenter = { lat: -22.9019, lng: -43.5596 };
  webMapZoom = 12;
  private webMap?: maplibregl.Map;
  private webMarkers: maplibregl.Marker[] = [];
  private userLocation?: { lat: number; lng: number };
  debugInfo = '';

  constructor() {}

  async ngAfterViewInit(): Promise<void> {
    this.carregando = true;
    await this.carregarPontos();
    if (this.useNativeMap && this.isNative) {
      try {
        await this.criarMapa();
      } catch (error) {
        this.mensagemMapa = 'Não foi possível carregar o mapa no dispositivo. Verifique chave da API, permissões e internet.';
        console.error('Falha ao inicializar Google Maps nativo:', error);
        this.mostrarMensagem(this.mensagemMapa, 'danger');
      }
    } else {
      try {
        this.criarMapaWeb();
      } catch (error) {
        this.mensagemMapa = 'Não foi possível carregar o mapa no navegador. Verifique a chave da API e sua conexão.';
        console.error('Falha ao inicializar MapLibre no navegador:', error);
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

  private criarMapaWeb(): void {
    if (!this.webMapRef?.nativeElement) {
      this.mensagemMapa = 'Container do mapa nÃ£o encontrado.';
      return;
    }

    this.webMap = new maplibregl.Map({
      container: this.webMapRef.nativeElement,
      style: GEOAPIFY_STYLE_URL,
      center: [this.webMapCenter.lng, this.webMapCenter.lat],
      zoom: this.webMapZoom,
      attributionControl: false
    });

    this.webMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    setTimeout(() => this.webMap?.resize(), 300);

    this.webMap.on('load', () => {
      this.renderMarkers();
    });

    this.webMap.on('error', (event) => {
      console.error('Erro MapLibre:', event?.error ?? event);
      if (!this.mensagemMapa) {
        this.mensagemMapa = 'Falha ao carregar o estilo do mapa. Verifique a chave Geoapify e a conexÃ£o.';
        this.mostrarMensagem(this.mensagemMapa, 'danger');
      }
    });
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
    const pontosComCoords = this.pontos.filter(p => p.lat !== undefined && p.lng !== undefined);
    this.debugInfo = `Pontos com coordenadas: ${pontosComCoords.length} | User: ${this.userLocation ? 'OK' : 'N/A'}`;
    console.log('[Coleta][Debug] total:', this.pontos.length, 'com coords:', pontosComCoords.length);
    if (pontosComCoords.length > 0) {
      console.log('[Coleta][Debug] exemplo coords:', {
        id: pontosComCoords[0].id,
        lat: pontosComCoords[0].lat,
        lng: pontosComCoords[0].lng
      });
    }
    if (!this.useNativeMap) {
      const primeiro = this.pontosFiltrados.find(ponto => ponto.lat !== undefined && ponto.lng !== undefined);
      if (primeiro) {
        this.webMapCenter = { lat: primeiro.lat as number, lng: primeiro.lng as number };
      }
      this.atualizarMapaWeb();
    }
    await this.renderMarkers();
  }

  private async geocodeEndereco(endereco: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        endereco
      )}&limit=1&apiKey=${GEOAPIFY_MAP_API_KEY}`;
      const resposta = await fetch(url);
      if (!resposta.ok) {
        return null;
      }
      const dados = (await resposta.json()) as {
        features: Array<{ properties: { lat: number; lon: number } }>;
      };
      if (!dados.features || dados.features.length === 0) {
        return null;
      }
      const { lat, lon } = dados.features[0].properties;
      return { lat, lng: lon };
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
    } else if (!this.useNativeMap && ponto.lat !== undefined && ponto.lng !== undefined) {
      this.webMapCenter = { lat: ponto.lat as number, lng: ponto.lng as number };
      this.webMapZoom = origemMapa ? 15 : 13;
      this.atualizarMapaWeb(true);
    }
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
    if (!this.useNativeMap) {
      const primeiro = this.pontosFiltrados.find(ponto => ponto.lat !== undefined && ponto.lng !== undefined);
      if (primeiro) {
        this.webMapCenter = { lat: primeiro.lat as number, lng: primeiro.lng as number };
        this.webMapZoom = 13;
      }
      this.atualizarMapaWeb();
    }
    this.renderMarkers();
  }
  private async atualizarLocalizacaoUsuario(): Promise<void> {
    try {
      const posicao = await Geolocation.getCurrentPosition();
      const origem = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
      this.userLocation = origem;
      const distancias: Record<string, number> = {};
      for (const ponto of this.pontos) {
        if (ponto.lat === undefined || ponto.lng === undefined) continue;
        distancias[ponto.id] = this.haversineKm(origem.lat, origem.lng, ponto.lat, ponto.lng);
      }
      this.pontosDistanciaKm = distancias;
    } catch {
      this.pontosDistanciaKm = {};
      this.userLocation = undefined;
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
  private async renderMarkers(): Promise<void> {
    if (this.useNativeMap) {
      await this.renderNativeMarkers();
      return;
    }

    this.renderWebMarkers();
  }

  private async renderNativeMarkers(): Promise<void> {
    if (!this.map) return;

    if (this.markerIds.length > 0 || this.userMarkerId) {
      const ids = [...this.markerIds, ...(this.userMarkerId ? [this.userMarkerId] : [])];
      await this.map.removeMarkers(ids);
      this.markerIds = [];
      this.markerPontoIdByMarkerId = {};
      this.userMarkerId = undefined;
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

    if (this.userLocation) {
      const [userId] = await this.map.addMarkers([
        {
          coordinate: {
            lat: this.userLocation.lat,
            lng: this.userLocation.lng
          },
          title: 'Sua localização',
          snippet: 'Você está aqui',
          tintColor: { r: 66, g: 133, b: 244, a: 255 }
        }
      ]);
      this.userMarkerId = userId;
    }
  }

  private renderWebMarkers(): void {
    if (!this.webMap) return;

    this.webMarkers.forEach(marker => marker.remove());
    this.webMarkers = [];

    const pontosComCoords = this.pontosFiltrados.filter(
      ponto => ponto.lat !== undefined && ponto.lng !== undefined
    );
    if (pontosComCoords.length === 0) return;
    console.log('[Coleta][Debug] renderWebMarkers pontos:', pontosComCoords.length);

    pontosComCoords.forEach(ponto => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'maplibregl-marker maplibre-marker';
      el.style.backgroundColor =
        ponto.id === this.selectedPontoId ? SELECTED_WEB_MARKER_COLOR : DEFAULT_WEB_MARKER_COLOR;
      el.setAttribute('aria-label', ponto.nome);
      el.addEventListener('click', () => this.selecionarPonto(ponto, true));

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([ponto.lng as number, ponto.lat as number])
        .addTo(this.webMap as maplibregl.Map);

      this.webMarkers.push(marker);
    });

    if (this.userLocation) {
      const el = document.createElement('div');
      el.className = 'maplibregl-marker maplibre-user-marker';
      el.textContent = '📍';
      el.style.fontSize = '22px';
      el.style.background = 'white';
      el.style.border = '2px solid #4285f4';
      el.style.borderRadius = '999px';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([this.userLocation.lng, this.userLocation.lat])
        .addTo(this.webMap as maplibregl.Map);

      this.webMarkers.push(marker);
      console.log('[Coleta][Debug] user marker added');
    }
  }

  private atualizarMapaWeb(animar = false): void {
    if (!this.webMap) return;
    const center = [this.webMapCenter.lng, this.webMapCenter.lat] as [number, number];
    if (animar) {
      this.webMap.easeTo({ center, zoom: this.webMapZoom });
      return;
    }
    this.webMap.setCenter(center);
    this.webMap.setZoom(this.webMapZoom);
  }
  private fecharAlerta(): void {
    this.mostrarAlerta = false;
  }

  ngOnDestroy(): void {
    this.webMarkers.forEach(marker => marker.remove());
    this.webMarkers = [];
    this.webMap?.remove();
    this.webMap = undefined;
  }
}









