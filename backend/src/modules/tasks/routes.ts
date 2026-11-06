
import { Router } from "express";
import user_middlewares from "../users/middlewares";
import controllers from "./controllers";

const router = Router();

// Consultar tarefas do usuário
router.get(
    "/overview",
    user_middlewares.user_token,
    controllers.get_overview
);

// Consultar participantes de um projeto
router.get(
    "/project/:project_id/members",
    user_middlewares.user_token,
    controllers.get_project_members
);

// Cadastrar uma demanda
router.post(
    "/",
    user_middlewares.user_token,
    controllers.create
);

export default router;
