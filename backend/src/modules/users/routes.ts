/* 
    Autor: Matheus Camargo Ginebro
    routes.ts -> Arquivo responsável por definir as rotas da API;
*/

import { Router } from "express";
import controllers from "./controllers";
import middlewares from "./middlewares";

const router = Router();

router.post(
	"/login",
	middlewares.user_email,
	middlewares.user_password,
	controllers.login_user,
);

router.post(
	"/register",
	middlewares.user_email,
	middlewares.user_password,
	middlewares.user_name,
	controllers.register_user,
);

router.get("/", middlewares.user_token, controllers.get_user);

export default router;
