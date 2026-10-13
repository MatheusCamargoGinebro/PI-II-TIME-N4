/* 
    Autor: Matheus Camargo Ginebro
    server.ts -> Arquivo responsável por iniciar o servidor;
*/

import app from "./app";
import http from "http";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";

http.createServer(app).listen({ port: PORT, host: HOST }, () => {
	console.log(`Servidor http rodando em: http://${HOST}:${PORT}`);
});
