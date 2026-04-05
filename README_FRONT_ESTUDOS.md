# Guia de estudos do frontend (Ionic + Angular)

Este material foi escrito para estudo prático, como em sala de aula.

## 1) Como pensar o frontend deste app
Divida o front em 3 camadas:
- Tela (HTML + SCSS): o que o usuário vê e interage.
- Componente (TypeScript): regras da tela, eventos e navegação.
- Serviços (TypeScript): regras compartilhadas e dados.

Com essa separação, o projeto fica mais limpo, reutilizável e fácil de manter.

## 2) Componentes Ionic usados no projeto

### Estrutura de página
- IonHeader
- IonToolbar
- IonTitle
- IonContent
- IonButtons
- IonButton
- IonIcon

### Formulários
- IonList
- IonItem
- IonLabel
- IonInput
- IonNote

### Feedback e estado
- IonAlert
- IonSkeletonText
- IonBadge
- IonFab
- IonFabButton
- IonSearchbar

### Estrutura raiz do app
- IonApp
- IonRouterOutlet

## 3) CSS/SCSS na prática

### Variáveis CSS
Use variáveis para manter padrão de:
- cores;
- sombras;
- espaçamentos;
- estados visuais.

### Layout moderno
Conceitos mais usados:
- display: flex;
- display: grid;
- gap;
- align-items;
- justify-content;
- border-radius;
- box-shadow.

### Customização no Ionic
No Ionic, a customização costuma ser feita por:
- CSS variables (ex.: --background, --color, --border-radius);
- partes nativas (ex.: ::part(native)).

## 4) TypeScript no projeto

### Componentes standalone
Cada página define os próprios imports dentro do @Component.

### Injeção de dependência
Padrão aplicado no projeto:
- inject(Router)
- inject(UsuarioService)
- inject(RankingService)

### Fluxo de ações
Boas práticas usadas:
- validar formulário antes de processar;
- usar estados de UI (carregando, processando, alerta);
- navegar por rota após ações de sucesso.

### Guards de rota
- authGuard: protege páginas privadas.
- guestGuard: evita abrir login/cadastro quando já autenticado.

## 5) Trilha de estudo recomendada
1. Ler [src/app/app.routes.ts](src/app/app.routes.ts) para entender o fluxo de rotas.
2. Ler [src/app/login/login.page.ts](src/app/login/login.page.ts) e [src/app/cadastro/cadastro.page.ts](src/app/cadastro/cadastro.page.ts) para formulários.
3. Ler [src/app/home/home.page.ts](src/app/home/home.page.ts) para navegação e composição da home.
4. Ler [src/app/coleta/coleta.page.ts](src/app/coleta/coleta.page.ts) para câmera, geolocalização e mapa.
5. Ler [src/app/ranking/ranking.page.ts](src/app/ranking/ranking.page.ts) para ranking e validações.
6. Ler [src/app/painel/painel.page.ts](src/app/painel/painel.page.ts) para ações rápidas e saída.

## 6) Exercícios práticos
- Criar um novo card na Home com dado calculado no TypeScript.
- Adicionar um filtro visual em Coleta sem alterar backend.
- Exibir mensagem de boas-vindas por horário.
- Criar um guard específico para perfil admin.
- Estilizar um botão usando apenas variáveis do Ionic.

## 7) Boas práticas para manter
- Comentar arquivos de página com cabeçalho curto e objetivo.
- Manter funções pequenas e com responsabilidade única.
- Evitar lógica pesada no HTML.
- Reutilizar serviços para não duplicar regra de negócio.
- Rodar build após mudanças para validar integridade.
