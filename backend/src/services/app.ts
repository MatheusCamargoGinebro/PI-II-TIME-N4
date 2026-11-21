// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    app.ts -> Arquivo responsável por configurar o servidor Express, middlewares globais e rotas da API;
*/

// O============================================================================================O

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import router from "./router";

const app = express();

// Configura CORS e parsing de corpo JSON e URL-encoded
app.use(
	cors({
		origin: "*",
	}),
	express.json({ limit: "50mb" }),
	express.urlencoded({ limit: "50mb", extended: true }),
);

// Valida a presença de corpo nas requisições de escrita, exceto em rotas que não exigem body
app.use((req: Request, res: Response, next: NextFunction) => {
	const methods_requiring_body = ["POST", "PUT", "PATCH"];
	const is_bodyless_route =
		req.path === "/users/logout" || req.path.endsWith("/cancel");

	if (
		methods_requiring_body.includes(req.method) &&
		!req.body &&
		!is_bodyless_route
	) {
		return res
			.status(400)
			.json({ message: "O corpo da requisição é obrigatório." });
	}

	return next();
});

// Registra o roteador principal da aplicação
app.use(router);

// Middleware global para tratamento de JSON inválido e erros inesperados
app.use(
	(
		err: Error & { status?: number; type?: string },
		__req: Request,
		res: Response,
		__next: NextFunction,
	) => {
		if (err.type === "entity.parse.failed") {
			return res.status(400).json({
				message: "O corpo da requisição contém um JSON inválido.",
			});
		}

		console.error("Erro interno não tratado:", err);
		return res.status(500).json({
			message: "Erro interno no servidor.",
		});
	},
);

export default app;

// O============================================================================================O
