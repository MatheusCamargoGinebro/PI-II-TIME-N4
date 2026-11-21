// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    routes.ts -> Arquivo responsável por definir todas as rotas do módulo de demandas, comentários, histórico e dashboard;
*/

// O============================================================================================O

import { Router } from "express";
import controllers from "./controllers";
import middlewares from "./middlewares";

const router = Router();

// Visão geral de demandas do usuário autenticado (aceita filtros de status, prioridade, tipo e busca)
router.get("/overview", middlewares.list_tasks_query, controllers.get_overview);

// Métricas consolidadas do Dashboard (Seção 2.4)
router.get(
	"/dashboard",
	middlewares.dashboard_query,
	controllers.get_dashboard,
);

// Listagem de demandas com filtros combinados, busca textual e ordenação (Seções 2.2.9 e 2.3)
router.get("/", middlewares.list_tasks_query, controllers.list_tasks);

// Cadastro de nova demanda (status inicial forçado para ABERTA + validação de feriado nacional)
router.post("/", middlewares.create_task_body, controllers.create_task);

// Detalhes completos de uma demanda específica
router.get(
	"/:task_id",
	middlewares.task_id_param,
	controllers.get_task_details,
);

// Edição completa ou parcial de uma demanda (grava histórico automático)
router.put(
	"/:task_id",
	middlewares.task_id_param,
	middlewares.update_task_body,
	controllers.update_task,
);

router.patch(
	"/:task_id",
	middlewares.task_id_param,
	middlewares.update_task_body,
	controllers.update_task,
);

// Atualização de status respeitando a máquina de estados e RBAC por perfil (Seção 2.2.4)
router.patch(
	"/:task_id/status",
	middlewares.task_id_param,
	middlewares.update_status_body,
	controllers.update_task_status,
);

// Cancelamento lógico de demanda sem exclusão física (Seções 2.2.4 e 2.2.8)
router.patch(
	"/:task_id/cancel",
	middlewares.task_id_param,
	controllers.cancel_task,
);

// Bloqueia explicitamente exclusão física via DELETE
router.delete(
	"/:task_id",
	middlewares.task_id_param,
	controllers.block_physical_delete,
);

// Listagem e criação de comentários da demanda (Seção 2.2.6)
router.get(
	"/:task_id/comments",
	middlewares.task_id_param,
	controllers.list_task_comments,
);

router.post(
	"/:task_id/comments",
	middlewares.task_id_param,
	middlewares.comment_body,
	controllers.create_task_comment,
);

// Consulta ao histórico automático de alterações da demanda (Seção 2.2.7)
router.get(
	"/:task_id/history",
	middlewares.task_id_param,
	controllers.list_task_history,
);

export default router;

// O============================================================================================O
