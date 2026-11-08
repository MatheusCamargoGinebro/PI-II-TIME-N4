/* 
    Autor: Matheus Camargo Ginebro
    routes.ts -> Arquivo responsável por definir as rotas da API;
*/

import { Router } from "express";
import controllers from "./controllers";
import middlewares from "./middlewares";

const router = Router();

router.get("/", controllers.get_user_projects);

router.get(
	"/:project_id",
	middlewares.project_id_param,
	controllers.get_project,
);

router.get(
	"/:project_id/tasks",
	middlewares.project_id_param,
	controllers.get_project_tasks,
);

router.get(
	"/:project_id/members",
	middlewares.project_id_param,
	controllers.get_project_members,
);

router.get(
	"/:project_id/members/:user_id",
	middlewares.project_id_param,
	middlewares.user_id,
	controllers.get_project_member_details,
);

export default router;
