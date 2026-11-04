/* 
    Autor: Matheus Camargo Ginebro
    routes.ts -> Arquivo responsável por definir as rotas da API;
*/

import { Router } from "express";
import user_middlewares from "../users/middlewares";
import controllers from "./controllers";
/* import middlewares from "./middlewares"; */

const router = Router();

router.get("/overview", user_middlewares.user_token, controllers.get_overview);

export default router;
