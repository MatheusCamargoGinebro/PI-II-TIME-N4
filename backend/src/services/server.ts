// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    server.ts -> Arquivo responsável por inicializar o servidor HTTP da API TaskOps;
*/

// O============================================================================================O

import app from "./app";
import http from "http";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente definidas no arquivo .env
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";

// Inicializa o servidor HTTP escutando na porta e host configurados
http.createServer(app).listen({ port: PORT, host: HOST }, () => {
	console.log(`Servidor http rodando em: http://${HOST}:${PORT}`);
});

// O============================================================================================O
