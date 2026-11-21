// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    router.ts -> Arquivo responsável por centralizar e proteger as rotas principais da API e expor a documentação HTML na rota raiz;
*/

// O============================================================================================O

import express, { Request, Response } from "express";
import user_routes from "../modules/users/routes";
import project_routes from "../modules/projects/routes";
import task_routes from "../modules/tasks/routes";
import user_middlewares from "../modules/users/middlewares";
import { openapi_spec, render_swagger_html } from "./swagger";

const router = express.Router();

// Rota raiz: exibe a página HTML completa listando todas as rotas, parâmetros e JSONs de teste/resposta
router.get("/", (__req: Request, res: Response) => {
	res.status(200).type("text/html; charset=utf-8").send(render_swagger_html());
});

// Especificação OpenAPI 3.0.3 em JSON (importável no Insomnia/Postman)
router.get("/openapi.json", (__req: Request, res: Response) => {
	res.status(200).json(openapi_spec);
});

// Rota de verificação de disponibilidade da API (healthcheck)
router.get("/health", (__req: Request, res: Response) => {
	res.status(200).json({ message: "API is running." });
});

// Rotas públicas e protegidas de usuários
router.use("/users", user_routes);

// Rotas protegidas por autenticação JWT para projetos e demandas
router.use("/projects", user_middlewares.user_token, project_routes);
router.use("/tasks", user_middlewares.user_token, task_routes);

export default router;

// O============================================================================================O
