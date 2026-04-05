# Backend mínimo do app (Node.js)

## Objetivo
Implementar um backend **simples e suficiente** para o app funcionar ponta a ponta com:
- autenticação;
- pontos no mapa;
- envio de foto da câmera;
- validação de descarte;
- ranking.

Este README evita complexidade desnecessária e define apenas o necessário para produção inicial.

## Escopo obrigatório
1. Cadastro de usuário
2. Login
3. Perfil autenticado (`/auth/me`)
4. Listagem de pontos de coleta
5. Registro de descarte com upload de foto
6. Listagem de descartes do usuário
7. Listagem de pendentes (admin)
8. Validação de descarte (admin)
9. Ranking por pontuação

## Stack sugerida (mínima)
- Node.js + Express
- Banco relacional (PostgreSQL ou MySQL)
- Upload local em disco (`/uploads`)
- JWT para autenticação
- `multer` para `multipart/form-data`

## Infra mínima necessária
- API HTTP rodando (porta definida por `PORT`)
- Banco acessível com credenciais por variável de ambiente
- CORS habilitado para o frontend Ionic
- Pasta de upload com permissão de escrita
- Rota estática para servir arquivos de `/uploads`

## Google Maps no Android (equipe)
Para o mapa funcionar no celular de qualquer pessoa, a chave da Google deve estar configurada por **package + SHA-1**.

- Package do app atual: `io.ionic.starter`
- API necessária: `Maps SDK for Android`
- Billing do projeto Google Cloud deve estar ativo

### Cenário 1: você gera APK e envia para os amigos
- Basta cadastrar o SHA-1 da chave usada para assinar esse APK.
- Todos que instalarem esse mesmo APK terão mapa funcionando.

### Cenário 2: cada dev compila no próprio computador
- Cada dev terá SHA-1 de debug diferente.
- É necessário adicionar no Google Cloud o SHA-1 de cada desenvolvedor, sempre com o mesmo package `io.ionic.starter`.

### Cenário 3 (recomendado para time/prod)
- Criar uma keystore de release única do projeto.
- Todos os builds distribuídos devem ser assinados com essa keystore.
- Cadastrar no Google Cloud o SHA-1 dessa keystore + package `io.ionic.starter`.

### Comando para obter SHA-1
No diretório `android/`:
```bash
./gradlew signingReport
```
No Windows:
```powershell
.\gradlew.bat signingReport
```

### Passo a passo no Google Cloud (menu a menu)
1. Acesse `Google Cloud Console` e selecione o projeto correto.
2. Vá em `APIs e serviços` → `Biblioteca`.
3. Procure e habilite `Maps SDK for Android`.
4. Vá em `Faturamento` e confirme que está ativo para esse projeto.
5. Vá em `APIs e serviços` → `Credenciais`.
6. Crie uma nova chave (`Criar credenciais` → `Chave de API`) ou edite a existente.
7. Em `Restrições do aplicativo`, selecione `Apps Android`.
8. Clique em `Adicionar um item` e preencha:
   - Nome do pacote: `io.ionic.starter`
   - SHA-1: (resultado do `signingReport`)
9. Em `Restrições de API`, selecione `Restringir chave` e marque `Maps SDK for Android`.
10. Salve e aguarde alguns minutos de propagação.
11. Reinstale o app no dispositivo para garantir uso da configuração atual.

### Erros mais comuns
- `API key invalid`: chave incorreta ou copiada com erro.
- `This API project is not authorized`: package/SHA-1 não confere com o app instalado.
- `Billing not enabled`: faturamento não ativo no projeto.
- Mapa em branco: alteração recente ainda propagando (aguardar e reinstalar app).

Não é obrigatório agora: Docker, microserviços, filas, cache distribuído, observabilidade avançada.

## Variáveis de ambiente (mínimo)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meuapp
DB_USER=usuario
DB_PASSWORD=senha
JWT_SECRET=troque_essa_chave
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=5
CORS_ORIGIN=http://localhost:8100
```

## Arquivos de referência
- [backend_schema.sql](backend_schema.sql)
- [README_FRONT_CRIACAO.md](README_FRONT_CRIACAO.md)
- [README_FRONT_ESTUDOS.md](README_FRONT_ESTUDOS.md)
- [src/app/services/usuario.service.ts](src/app/services/usuario.service.ts)
- [src/app/services/coleta-pontos.service.ts](src/app/services/coleta-pontos.service.ts)
- [src/app/services/ranking.service.ts](src/app/services/ranking.service.ts)

## Contrato mínimo de API

### POST /api/auth/register
Body:
```json
{
  "nome": "Gabriel",
  "anoNascimento": "2000-05",
  "telefone": "21999999999",
  "email": "gabriel@email.com",
  "senha": "Senha123"
}
```
Retorno sugerido:
```json
{
  "id": 1,
  "nome": "Gabriel",
  "email": "gabriel@email.com",
  "tipo": "usuario"
}
```

### POST /api/auth/login
Body:
```json
{
  "email": "gabriel@email.com",
  "senha": "Senha123"
}
```
Retorno esperado:
```json
{
  "token": "jwt_aqui",
  "usuario": {
    "nome": "Gabriel",
    "email": "gabriel@email.com",
    "tipo": "usuario"
  }
}
```

### GET /api/auth/me
Header:
```txt
Authorization: Bearer jwt_aqui
```

### GET /api/pontos-coleta
Retorna lista de pontos de coleta com coordenadas para o mapa.

Exemplo de item:
```json
{
  "id": 1,
  "nome": "Ecoponto Centro",
  "tipo": "reciclavel",
  "bairro": "Centro",
  "endereco": "Rua X, 100",
  "lat": -22.9035,
  "lng": -43.2096,
  "avaliacao": 4.7
}
```

### POST /api/descartes
Header:
```txt
Authorization: Bearer jwt_aqui
Content-Type: multipart/form-data
```

Campos `form-data`:
- `foto` (arquivo de imagem)
- `lat` (number)
- `lng` (number)

Retorno esperado:
```json
{
  "id": "desc-123",
  "email": "gabriel@email.com",
  "fotoUrl": "/uploads/desc-123.jpg",
  "lat": -22.88,
  "lng": -43.55,
  "dataISO": "2026-03-13T15:10:00.000Z",
  "status": "pendente"
}
```

### GET /api/descartes/me
Retorna descartes do usuário autenticado.

### GET /api/descartes/pendentes
Somente admin.

### PUT /api/descartes/:id/validar
Somente admin.
Regra: cada descarte validado soma 10 pontos.

### GET /api/ranking
Retorna ranking ordenado por pontos (decrescente).

## Modelo mínimo de dados

### usuarios
- id
- nome
- ano_nascimento
- telefone
- email
- senha_hash
- tipo (`usuario` | `admin`)

### pontos_coleta
- id
- nome
- tipo
- bairro
- endereco
- lat
- lng
- avaliacao

### descartes
- id
- usuario_id
- foto_url
- lat
- lng
- data_iso
- status (`pendente` | `validado`)

## Regras de negócio mínimas
- E-mail único.
- Senha sempre armazenada com hash.
- Apenas autenticado registra descarte.
- Apenas admin valida descarte — usuário comum **nunca** pode validar o próprio descarte.
- Validação gera +10 pontos no ranking.
- `GET /api/pontos-coleta` deve retornar `lat/lng` válidos ou `null`.

## Administradores do sistema

O app possui 3 administradores fixos:

| Nome | Função |
|---|---|
| Beatriz Freitas | Admin |
| Samuel Valentim | Admin |
| Gabriel Suliano | Admin |

### Como funciona no modo local (antes do backend)
- O frontend identifica admins pelo **nome exato** cadastrado.
- Ao se cadastrar com um dos nomes acima, o app atribui `tipo: 'admin'` automaticamente.
- Apenas admins veem o botão **Validar** na tela de ranking.

### Como deve funcionar no backend
- O campo `tipo` fica na tabela `usuarios` com valor `'usuario'` ou `'admin'`.
- Os 3 admins devem ser inseridos diretamente no banco com `tipo = 'admin'` (não pelo cadastro normal do app).
- A rota `PUT /api/descartes/:id/validar` deve verificar `tipo === 'admin'` via JWT e rejeitar com `403` se não for admin.
- Usuário comum **não pode** mudar o próprio `tipo` — esse campo nunca deve ser enviado/aceito pelo endpoint de cadastro.

Exemplo de INSERT para criar os admins no banco:
```sql
INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES
  ('Beatriz Freitas', 'beatriz@app.com', '<hash_da_senha>', 'admin'),
  ('Samuel Valentim', 'samuel@app.com', '<hash_da_senha>', 'admin'),
  ('Gabriel Suliano', 'gabriel@app.com', '<hash_da_senha>', 'admin');
```

## Ordem de implementação (recomendada)
1. Executar [backend_schema.sql](backend_schema.sql)
2. Implementar auth (`register`, `login`, `me`)
3. Implementar `GET /api/pontos-coleta`
4. Implementar upload e `POST /api/descartes`
5. Implementar `GET /api/descartes/me` e `GET /api/descartes/pendentes`
6. Implementar `PUT /api/descartes/:id/validar`
7. Implementar `GET /api/ranking`

## Checklist de pronto
- Cadastro e login funcionando com JWT.
- Mapa recebe pontos com `lat/lng` via API.
- Câmera envia foto e backend devolve `fotoUrl` acessível.
- Admin valida descarte e pontuação sobe +10.
- Ranking ordena corretamente por pontos.
- Front não depende mais de `localStorage` para dados principais.

## Status de compatibilidade (2026-03-13)
- Frontend segue compatível com este contrato.
- [backend_schema.sql](backend_schema.sql) permanece suficiente para a versão mínima.

## Como verificar se a API está funcionando
1. Abra um terminal e rode o backend:
   ```bash
   cd backend
   node server.js
   ```
   - Se tudo estiver certo, verá no console: **"Servidor rodando na porta NNNN"**.

2. Teste um endpoint simples no navegador ou no terminal:
   - No navegador: acesse `http://localhost:<PORT>/api/pontos-coleta`
   - No terminal (curl):
     ```bash
     curl http://localhost:<PORT>/api/pontos-coleta
     ```
   - Substitua `<PORT>` pelo valor em `backend/.env` (padrão: 3002).

3. Teste login com POST (exemplo com curl):
   ```bash
   curl -X POST http://localhost:<PORT>/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@example.com","senha":"12345"}'
   ```

4. Se os endpoints retornarem JSON sem erro, a API está funcionando.

---

> Dica rápida: sempre que mudar a porta em `backend/.env`, reinicie o servidor e use essa porta nas URLs acima.

rode o comando: npm run apk:desktop no terminal do vs code, para gerar um apk na area de trabalho

