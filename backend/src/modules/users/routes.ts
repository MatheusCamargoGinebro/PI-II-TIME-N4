// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    routes.ts -> Arquivo responsável por definir as rotas do módulo de usuários;
*/

// O============================================================================================O

import { Router } from "express";
import controllers from "./controllers";
import middlewares from "./middlewares";

const router = Router();

// Rota pública de autenticação
router.post(
	"/login",
	middlewares.user_email,
	middlewares.user_password,
	controllers.login_user,
);

// Rota pública de registro de usuário
router.post(
	"/register",
	middlewares.user_email,
	middlewares.user_password,
	middlewares.user_name,
	controllers.register_user,
);

// Rota protegida para obter dados do usuário autenticado
router.get("/", middlewares.user_token, controllers.get_user);

// Rota protegida para listar todos os usuários (exclusiva para Administrador)
router.get("/list", middlewares.user_token, controllers.list_users);

export default router;

// O============================================================================================O
