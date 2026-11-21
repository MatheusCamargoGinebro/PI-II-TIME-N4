// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    routes.ts -> Arquivo responsável por definir as rotas do módulo de projetos;
*/

// O============================================================================================O

import { Router } from "express";
import controllers from "./controllers";
import middlewares from "./middlewares";

const router = Router();

// Lista projetos visíveis ao usuário autenticado
router.get("/", controllers.get_user_projects);

// Cadastra um novo projeto (exclusivo para Administrador)
router.post("/", middlewares.project_title, controllers.register_new_project);

// Detalhes e totalizadores de um projeto específico
router.get(
	"/:project_id",
	middlewares.project_id_param,
	controllers.get_project,
);

// Lista demandas de um projeto específico
router.get(
	"/:project_id/tasks",
	middlewares.project_id_param,
	controllers.get_project_tasks,
);

// Lista membros vinculados a um projeto
router.get(
	"/:project_id/members",
	middlewares.project_id_param,
	controllers.get_project_members,
);

// Vincula um usuário a um projeto (Administrador ou Líder de projeto vinculado)
router.post(
	"/:project_id/members",
	middlewares.project_id_param,
	middlewares.member_user_id,
	controllers.add_project_member,
);

// Detalhes e tarefas de um membro específico dentro do projeto
router.get(
	"/:project_id/members/:user_id",
	middlewares.project_id_param,
	middlewares.user_id,
	controllers.get_project_member_details,
);

export default router;

// O============================================================================================O
