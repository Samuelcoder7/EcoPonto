# Frontend - Como foi criado

## 1) Visão geral
Este frontend foi desenvolvido com Ionic + Angular (arquitetura standalone), com foco em:
- experiência mobile;
- navegação simples por rotas;
- organização por páginas e serviços;
- integração preparada para backend.

## 2) Stack e versões utilizadas
Fonte: [package.json](package.json).

### Dependências de runtime
- @angular/animations: ^20.0.0
- @angular/common: ^20.0.0
- @angular/compiler: ^20.0.0
- @angular/core: ^20.0.0
- @angular/forms: ^20.0.0
- @angular/platform-browser: ^20.0.0
- @angular/platform-browser-dynamic: ^20.0.0
- @angular/router: ^20.0.0
- @ionic/angular: ^8.0.0
- ionicons: ^7.0.0
- @capacitor/android: ^8.2.0
- @capacitor/app: 8.0.1
- @capacitor/camera: ^8.0.2
- @capacitor/core: 8.2.0
- @capacitor/geolocation: ^8.1.0
- @capacitor/google-maps: ^8.0.1
- @capacitor/haptics: 8.0.1
- @capacitor/keyboard: 8.0.1
- @capacitor/status-bar: 8.0.1
- rxjs: ~7.8.0
- tslib: ^2.3.0
- zone.js: ~0.15.0

### Dependências de desenvolvimento e build
- @angular-devkit/build-angular: ^20.0.0
- @angular-eslint/builder: ^20.0.0
- @angular-eslint/eslint-plugin: ^20.0.0
- @angular-eslint/eslint-plugin-template: ^20.0.0
- @angular-eslint/schematics: ^20.0.0
- @angular-eslint/template-parser: ^20.0.0
- @angular/cli: ^20.0.0
- @angular/compiler-cli: ^20.0.0
- @angular/language-service: ^20.0.0
- @capacitor/cli: 8.2.0
- @ionic/angular-toolkit: ^12.0.0
- @types/jasmine: ~5.1.0
- @typescript-eslint/eslint-plugin: ^8.18.0
- @typescript-eslint/parser: ^8.18.0
- eslint: ^9.16.0
- eslint-plugin-import: ^2.29.1
- eslint-plugin-jsdoc: ^48.2.1
- eslint-plugin-prefer-arrow: 1.2.2
- jasmine-core: ~5.1.0
- jasmine-spec-reporter: ~5.0.0
- karma: ~6.4.0
- karma-chrome-launcher: ~3.2.0
- karma-coverage: ~2.2.0
- karma-jasmine: ~5.1.0
- karma-jasmine-html-reporter: ~2.1.0
- typescript: ~5.9.0

## 3) Arquitetura aplicada
- UI: componentes Ionic por página.
- Rotas: Angular Router com guards de autenticação.
- Estado de usuário: serviço local com persistência em localStorage.
- Coleta e ranking: serviços dedicados para regras de negócio.
- Estilos: SCSS por página + variáveis globais.

## 4) Fluxo de telas
- Visitante: Login e Cadastro.
- Autenticado: Home, Coleta, Ranking e Painel.

## 5) Passo a passo para executar
1. Instalar dependências:
   - npm install
2. Rodar em desenvolvimento:
   - npm start
3. Gerar build web:
   - npm run build
4. Gerar APK debug Android:
   - npm run apk

### APK debug no Windows (padrão do projeto)
- Comando oficial: `npm run apk`
- Resultado: gera e copia em `C:\Users\SEU_USUARIO\Desktop\app-debug.apk`
- Se já existir, substitui automaticamente.

## 6) Observações
- No estágio atual, o projeto usa serviços locais para simular backend.
- O contrato do backend está em [README_BACKEND.md](README_BACKEND.md).
- O schema atual em [backend_schema.sql](backend_schema.sql) permaneceu compatível após a revisão do frontend.

## 7) O que fazer no frontend após o backend ficar pronto

Objetivo: integrar API real e **remover a dependência de `localStorage`** nas regras principais.

1. Configurar URL base da API
   - Definir `apiBaseUrl` nos arquivos de ambiente (`src/environments`).
   - Exemplo: `https://seu-backend/api`.

2. Substituir persistência local por API
   - Remover fluxo de dados do `localStorage` para cadastro/login/coleta/ranking.
   - Manter no `localStorage` apenas dados de sessão (ex.: token), se necessário.

3. Integrar autenticação
   - Trocar login/cadastro para `POST /api/auth/login` e `POST /api/auth/register`.
   - Salvar token e enviar `Authorization: Bearer <token>` nas rotas protegidas.

4. Integrar coleta (foto + localização)
   - No modo API, enviar descarte para `POST /api/descartes` como `multipart/form-data`:
     - `foto` (arquivo da câmera)
     - `lat`
     - `lng`
   - Após integração, não usar `fotoDataUrl` como persistência principal no frontend.

5. Integrar ranking e validação
   - Ranking: consumir `GET /api/ranking`.
   - Meus registros: `GET /api/descartes/me`.
   - Pendentes (admin): `GET /api/descartes/pendentes`.
   - Validar: `PUT /api/descartes/:id/validar`.

6. Checklist rápido de validação
   - Tirar foto na tela de coleta e confirmar registro retornado pelo backend.
   - Verificar imagem abrindo a URL de `fotoUrl` retornada.
   - Validar descarte como admin e confirmar +10 pontos no ranking.
   - Confirmar que ranking e histórico persistem entre dispositivos/sessões via backend.
