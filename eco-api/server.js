// Importação dos módulos necessários para o servidor
// Express: framework para criar aplicações web em Node.js
// Axios: biblioteca para fazer requisições HTTP
// CORS: middleware para permitir requisições de diferentes origens
const express = require("express")
const axios = require("axios")
const cors = require("cors")

// Criação da instância da aplicação Express
const app = express()

// Habilita o middleware CORS para permitir requisições cross-origin
app.use(cors())

// Definição da URL da API do SheetDB, que conecta ao Google Sheets
// Substitua pela sua própria URL da API do SheetDB
const API_PLANILHA = "https://sheetdb.io/api/v1/b1ayregriedy4"

// Definição da rota GET para '/ecopontos'
// Esta rota busca dados da planilha via SheetDB e retorna como JSON
app.get("/ecopontos", async (req, res) => {

    // Bloco try-catch para tratamento de erros
    try {

        // Faz uma requisição GET para a API do SheetDB
        const response = await axios.get(API_PLANILHA)

        // Retorna os dados recebidos como resposta JSON
        res.json(response.data)

    } catch (error) {

        // Em caso de erro, retorna status 500 com mensagem de erro
        res.status(500).json({
            erro: "Erro ao buscar dados"
        })

    }

})

// Inicia o servidor na porta 3000
app.listen(3000, () => {

    // Log no console indicando que o servidor está rodando
    console.log("API rodando 🚀")
    console.log("Teste em:")
    console.log("http://localhost:3000/ecopontos")

})