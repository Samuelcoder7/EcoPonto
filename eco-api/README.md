# Eco-API

Esta é uma API simples construída com Node.js e Express que busca dados de ecopontos de uma planilha do Google Sheets via SheetDB e os expõe em um endpoint REST.

## Pré-requisitos

- Node.js instalado (versão 14 ou superior recomendada)
- NPM (geralmente vem com Node.js)

## Instalação

1. Clone ou baixe este repositório para sua máquina.

2. Navegue até o diretório do projeto:
   ```
   cd eco-api
   ```

3. Instale as dependências:
   ```
   npm install
   ```

## Como executar

1. Inicie o servidor:
   ```
   node server.js
   ```

2. O servidor estará rodando na porta 3000. Você verá a mensagem:
   ```
   API rodando 🚀
   Teste em:
   http://localhost:3000/ecopontos
   ```

## Testando a API

### Via navegador ou ferramenta como Postman/Insomnia

Acesse: `http://localhost:3000/ecopontos`

Isso retornará um JSON com a lista de ecopontos.

### Via arquivo de teste

Abra o arquivo `teste.html` em seu navegador. Ele fará uma requisição para a API e exibirá os ecopontos em uma lista simples.

## Sobre os Dados

Esta API depende de uma planilha do Google Sheets conectada via SheetDB. Os dados dos ecopontos (como nome, tipo de resíduo e endereço) são armazenados nessa planilha.

**Importante:** Se a planilha estiver vazia ou não contiver dados, a API não retornará nenhuma informação. Isso significa que ao testar (via navegador, Postman ou `teste.html`), você pode ver uma lista vazia ou um array vazio `[]`. Certifique-se de alimentar a planilha com os dados necessários antes de usar a API.

Para editar a planilha:
- Acesse o Google Sheets associado à URL do SheetDB.
- Adicione linhas com colunas como `nome`, `tipo_residuo` e `endereco` (ajuste conforme o formato esperado).

## Estrutura do projeto

- `server.js`: Código principal do servidor Express
- `package.json`: Dependências e configurações do projeto
- `teste.html`: Arquivo HTML para testar a API localmente

## Dependências

- Express: Framework web para Node.js
- Axios: Cliente HTTP para fazer requisições
- CORS: Middleware para permitir requisições de origens diferentes

## Notas

- A API utiliza o SheetDB para acessar dados de uma planilha do Google Sheets. Certifique-se de que a URL da API (`https://sheetdb.io/api/v1/b1ayregriedy4`) esteja acessível.
- Se precisar alterar a porta, modifique o código em `server.js`.